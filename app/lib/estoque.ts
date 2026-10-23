import type { Produto } from "./store";

export type StatusEstoque = "sem" | "baixo" | "ok";

const PESO_STATUS: Record<StatusEstoque, number> = {
  sem: 0,
  baixo: 1,
  ok: 2,
};

/**
 * Um produto entra em alerta quando a quantidade chega ao estoque mínimo
 * ou fica abaixo dele. Zero é tratado como "sem estoque".
 */
export function statusEstoque(produto: Produto): StatusEstoque {
  if (produto.quantidade <= 0) return "sem";
  if (produto.quantidade <= produto.estoqueMinimo) return "baixo";
  return "ok";
}

export function precisaRepor(produto: Produto) {
  return statusEstoque(produto) !== "ok";
}

/** Produtos em alerta, do mais crítico para o menos crítico. */
export function produtosComAlerta(produtos: Produto[]) {
  return produtos
    .filter(precisaRepor)
    .sort((a, b) => {
      const porStatus =
        PESO_STATUS[statusEstoque(a)] - PESO_STATUS[statusEstoque(b)];

      if (porStatus !== 0) return porStatus;

      const folgaA = a.quantidade - a.estoqueMinimo;
      const folgaB = b.quantidade - b.estoqueMinimo;

      if (folgaA !== folgaB) return folgaA - folgaB;

      return a.nome.localeCompare(b.nome, "pt-BR");
    });
}
