import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/servidor";
import { vendaDTO } from "@/lib/server/dto";
import { ErroApi, lerCorpoJson, respostaErro } from "@/lib/server/http";
import { criarVenda } from "@/lib/server/vendas";

const esquemaVenda = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.number().int().positive(),
      })
    )
    .min(1),
  desconto: z.number().finite().min(0).default(0),
  formaPagamento: z.enum(["dinheiro", "cartao", "pix"]),
  valorRecebido: z.number().finite().min(0).default(0),
});

export async function GET() {
  try {
    await exigirUsuario();
    const vendas = await prisma.venda.findMany({
      orderBy: { data: "desc" },
      take: 2000,
      include: { itens: true },
    });

    return Response.json({ vendas: vendas.map(vendaDTO) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  try {
    await exigirUsuario();
    const corpo = await lerCorpoJson<unknown>(request);
    const validado = esquemaVenda.safeParse(corpo);

    if (!validado.success) {
      throw new ErroApi(400, "Dados da venda inválidos.", validado.error.flatten());
    }

    const venda = await criarVenda(validado.data);
    return Response.json({ venda }, { status: 201 });
  } catch (erro) {
    return respostaErro(erro);
  }
}
