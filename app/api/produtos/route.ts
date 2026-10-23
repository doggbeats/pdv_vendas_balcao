import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/servidor";
import { produtoDTO } from "@/lib/server/dto";
import { ErroApi, lerCorpoJson, respostaErro } from "@/lib/server/http";
import { gerarCodigoProduto } from "@/lib/server/produtos";

const esquemaProduto = z.object({
  codigo: z.string().trim().optional(),
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

export async function GET() {
  try {
    await exigirUsuario();
    const produtos = await prisma.produto.findMany({ orderBy: { nome: "asc" } });
    return Response.json({ produtos: produtos.map(produtoDTO) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  try {
    await exigirUsuario();
    const corpo = await lerCorpoJson<unknown>(request);
    const validado = esquemaProduto.safeParse(corpo);

    if (!validado.success) {
      throw new ErroApi(400, "Dados do produto inválidos.", validado.error.flatten());
    }

    const dados = validado.data;
    const codigo = dados.codigo?.trim() || gerarCodigoProduto();

    const existente = await prisma.produto.findUnique({ where: { codigo } });
    if (existente) {
      throw new ErroApi(409, "Já existe um produto com este código.");
    }

    const produto = await prisma.$transaction(async (tx) => {
      const criado = await tx.produto.create({
        data: {
          codigo,
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

      if (criado.quantidade > 0) {
        await tx.movimentoEstoque.create({
          data: {
            produtoId: criado.id,
            tipo: "ENTRADA",
            quantidade: criado.quantidade,
            motivo: "Cadastro inicial do produto",
          },
        });
      }

      return criado;
    });

    return Response.json({ produto: produtoDTO(produto) }, { status: 201 });
  } catch (erro) {
    return respostaErro(erro);
  }
}
