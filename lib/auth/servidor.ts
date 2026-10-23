import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  COOKIE_SESSAO,
  segredoAuth,
  verificarTokenSessao,
} from "@/lib/auth/session";
import { ErroApi } from "@/lib/server/http";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "OPERADOR";
};

export async function obterUsuarioAtual(): Promise<UsuarioSessao | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESSAO)?.value;

  if (!token) return null;

  const payload = await verificarTokenSessao(token, segredoAuth());
  if (!payload) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, nome: true, email: true, papel: true, ativo: true },
  });

  if (!usuario || !usuario.ativo) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };
}

export async function exigirUsuario() {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    throw new ErroApi(401, "Sessão expirada. Faça login novamente.");
  }

  return usuario;
}

export async function exigirAdmin() {
  const usuario = await exigirUsuario();

  if (usuario.papel !== "ADMIN") {
    throw new ErroApi(403, "Apenas o administrador pode executar esta ação.");
  }

  return usuario;
}
