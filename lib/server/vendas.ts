import "server-only";

import { prisma } from "@/lib/db";
import { ErroApi } from "@/lib/server/http";
import {
  arredondarMoeda,
  formaPagamentoPrisma,
  vendaDTO,
  type VendaDTO,
} from "@/lib/server/dto";

export type EntradaNovaVenda = {
  itens: Array<{ produtoId: string; quantidade: number }>;
  desconto: number;
  formaPagamento: "dinheiro" | "cartao" | "pix";
  valorRecebido: number;
};

export async function criarVenda(entrada: EntradaNovaVenda): Promise<VendaDTO> {
  if (entrada.itens.length === 0) {
    throw new ErroApi(400, "Adicione ao menos um produto ao carrinho.");
  }

  const ids = Array.from(new Set(entrada.itens.map((item) => item.produtoId)));
  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids } },
  });

  const porId = new Map(produtos.map((produto) => [produto.id, produto]));

  for (const item of entrada.itens) {
    if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      throw new ErroApi(400, "Quantidade inválida em um dos itens.");
    }

    const produto = porId.get(item.produtoId);
    if (!produto) {
      throw new ErroApi(400, "Um dos produtos não foi encontrado.");
    }

    if (item.quantidade > produto.quantidade) {
      throw new ErroApi(
        409,
        `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade}.`
      );
    }
  }

  const subtotal = arredondarMoeda(
    entrada.itens.reduce((total, item) => {
      const produto = porId.get(item.produtoId)!;
      return total + Number(produto.valorVenda) * item.quantidade;
    }, 0)
  );

  const desconto = arredondarMoeda(
    Math.min(Math.max(entrada.desconto || 0, 0), subtotal)
  );
  const total = arredondarMoeda(subtotal - desconto);
  const valorRecebido = arredondarMoeda(
    entrada.formaPagamento === "dinheiro" ? entrada.valorRecebido : total
  );

  const venda = await prisma.$transaction(async (tx) => {
    for (const item of entrada.itens) {
      const produto = porId.get(item.produtoId)!;
      const atualizado = await tx.produto.updateMany({
        where: {
          id: item.produtoId,
          quantidade: { gte: item.quantidade },
        },
        data: { quantidade: { decrement: item.quantidade } },
      });

      if (atualizado.count === 0) {
        throw new ErroApi(
          409,
          `Estoque insuficiente para "${produto.nome}".`
        );
      }

      await tx.movimentoEstoque.create({
        data: {
          produtoId: item.produtoId,
          tipo: "SAIDA",
          quantidade: -item.quantidade,
          motivo: "Venda",
        },
      });
    }

    const criada = await tx.venda.create({
      data: {
        subtotal,
        desconto,
        total,
        formaPagamento: formaPagamentoPrisma(entrada.formaPagamento),
        valorRecebido,
        troco: Math.max(arredondarMoeda(valorRecebido - total), 0),
        itens: {
          create: entrada.itens.map((item) => {
            const produto = porId.get(item.produtoId)!;
            return {
              produtoId: produto.id,
              codigo: produto.codigo,
              nome: produto.nome,
              categoria: produto.categoria,
              valorUnitario: produto.valorVenda,
              quantidade: item.quantidade,
            };
          }),
        },
      },
      include: { itens: true },
    });

    await tx.movimentoCaixa.create({
      data: {
        tipo: "VENDA",
        valor: total,
        descricao: `Venda #${criada.numero}`,
        vendaId: criada.id,
      },
    });

    return criada;
  });

  return vendaDTO(venda);
}
