import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/servidor";
import { produtoDTO } from "@/lib/server/dto";
import { ErroApi, lerCorpoJson, respostaErro } from "@/lib/server/http";

const esquemaProduto = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  categoria: z.string().trim().min(1, "Selecione uma categoria."),
  valorCusto: z.number().finite().min(0),
  valorVenda: z.number().finite().min(0),
  quantidade: z.number().int().min(0),
  estoqueMinimo: z.number().int().min(0),
  unidadeMedida: z.string().trim().min(1),
  unidadesPorCaixinha: z.number().int().min(1).default(1),
  especificacao: z.string().default(""),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirUsuario();
    const { id } = await params;
    const corpo = await lerCorpoJson<unknown>(request);
    const validado = esquemaProduto.safeParse(corpo);

    if (!validado.success) {
      throw new ErroApi(400, "Dados do produto inválidos.", validado.error.flatten());
    }

    const existente = await prisma.produto.findUnique({ where: { id } });
    if (!existente) {
      throw new ErroApi(404, "Produto não encontrado.");
    }

    const dados = validado.data;
    const diferencaEstoque = dados.quantidade - existente.quantidade;

    const produto = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.produto.update({
        where: { id },
        data: {
          nome: dados.nome,
          categoria: dados.categoria,
          valorCusto: dados.valorCusto,
          valorVenda: dados.valorVenda,
          quantidade: dados.quantidade,
          estoqueMinimo: dados.estoqueMinimo,
          unidadeMedida: dados.unidadeMedida,
          unidadesPorCaixinha:
            dados.unidadeMedida === "CX" ? dados.unidadesPorCaixinha : 1,
          especificacao: dados.especificacao.trim(),
        },
      });

      if (diferencaEstoque !== 0) {
        await tx.movimentoEstoque.create({
          data: {
            produtoId: id,
            tipo: diferencaEstoque > 0 ? "ENTRADA" : "SAIDA",
            quantidade: diferencaEstoque,
            motivo: "Ajuste manual de estoque",
          },
        });
      }

      return atualizado;
    });

    return Response.json({ produto: produtoDTO(produto) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirUsuario();
    const { id } = await params;

    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new ErroApi(404, "Produto não encontrado.");
    }

    const [itens, movimentos] = await Promise.all([
      prisma.itemVenda.count({ where: { produtoId: id } }),
      prisma.movimentoEstoque.count({ where: { produtoId: id } }),
    ]);

    if (itens > 0) {
      throw new ErroApi(
        409,
        "Não é possível excluir este produto pois ele já foi vendido. Você pode zerar o estoque ou editar o produto."
      );
    }

    if (movimentos > 0) {
      throw new ErroApi(
        409,
        "Não é possível excluir este produto pois existem movimentações de estoque vinculadas."
      );
    }

    await prisma.produto.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
