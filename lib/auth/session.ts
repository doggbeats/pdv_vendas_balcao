export const COOKIE_SESSAO = "ph_gestao_sessao";
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 8;

export type TokenSessao = {
  sub: string;
  papel: "ADMIN" | "OPERADOR";
  exp: number;
};

function bytesParaBase64Url(bytes: Uint8Array) {
  let binario = "";
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlParaBytes(valor: string) {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const preenchimento = "=".repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(base64 + preenchimento);
  return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
}

async function importarChave(segredo: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function assinar(conteudo: string, segredo: string) {
  const chave = await importarChave(segredo);
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(conteudo)
  );
  return bytesParaBase64Url(new Uint8Array(assinatura));
}

export async function criarTokenSessao(
  dados: Omit<TokenSessao, "exp">,
  segredo: string
) {
  const expiraEm = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS;
  const payload: TokenSessao = { ...dados, exp: expiraEm };
  const conteudo = bytesParaBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const assinatura = await assinar(conteudo, segredo);
  return `${conteudo}.${assinatura}`;
}

export async function verificarTokenSessao(
  token: string | undefined | null,
  segredo: string
): Promise<TokenSessao | null> {
  if (!token) return null;

  const [conteudo, assinatura] = token.split(".");
  if (!conteudo || !assinatura) return null;

  try {
    const chave = await importarChave(segredo);
    const valida = await crypto.subtle.verify(
      "HMAC",
      chave,
      base64UrlParaBytes(assinatura),
      new TextEncoder().encode(conteudo)
    );

    if (!valida) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlParaBytes(conteudo))
    ) as TokenSessao;

    if (!payload.sub || !payload.exp || payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function segredoAuth() {
  const segredo = process.env.AUTH_SECRET;

  if (!segredo) {
    throw new Error("AUTH_SECRET não configurado.");
  }

  return segredo;
}
