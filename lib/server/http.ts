export class ErroApi extends Error {
  status: number;
  detalhes?: unknown;

  constructor(status: number, mensagem: string, detalhes?: unknown) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.detalhes = detalhes;
  }
}

export function respostaErro(erro: unknown) {
  if (erro instanceof ErroApi) {
    return Response.json(
      { erro: erro.message, detalhes: erro.detalhes },
      { status: erro.status }
    );
  }

  console.error("Erro interno:", erro);

  return Response.json(
    { erro: "Erro interno do servidor." },
    { status: 500 }
  );
}

export async function lerCorpoJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ErroApi(400, "Corpo da requisição inválido.");
  }
}

export function obterIp(request: Request) {
  const encaminhado = request.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

export function obterUserAgent(request: Request) {
  return request.headers.get("user-agent") ?? "desconhecido";
}
