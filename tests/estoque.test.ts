import { describe, expect, it } from "vitest";
import type { Produto } from "@/app/lib/store";
import { produtosComAlerta, statusEstoque } from "@/app/lib/estoque";

function produto(parcial: Partial<Produto> & Pick<Produto, "nome">): Produto {
  return {
    id: parcial.nome.toLowerCase().replace(/\s+/g, "-"),
    codigo: "PROD-TESTE",
    categoria: "cervejas",
    valorCusto: 1,
    valorVenda: 2,
    quantidade: 0,
    estoqueMinimo: 0,
    unidadeMedida: "UN",
    unidadesPorCaixinha: 1,
    especificacao: "",
    validade: "",
    ...parcial,
  };
}

describe("statusEstoque", () => {
  it("marca como sem estoque quando a quantidade zera", () => {
    expect(statusEstoque(produto({ nome: "Skol", quantidade: 0 }))).toBe("sem");
  });

  it("marca como baixo quando a quantidade atinge o mínimo", () => {
    expect(
      statusEstoque(produto({ nome: "Brahma", quantidade: 6, estoqueMinimo: 6 }))
    ).toBe("baixo");

    expect(
      statusEstoque(produto({ nome: "Brahma", quantidade: 5, estoqueMinimo: 6 }))
    ).toBe("baixo");
  });

  it("marca como ok acima do mínimo", () => {
    expect(
      statusEstoque(produto({ nome: "Heineken", quantidade: 7, estoqueMinimo: 6 }))
    ).toBe("ok");
  });
});

describe("produtosComAlerta", () => {
  it("lista sem estoque antes dos de estoque baixo", () => {
    const alertas = produtosComAlerta([
      produto({ nome: "Coca", quantidade: 3, estoqueMinimo: 10 }),
      produto({ nome: "Agua", quantidade: 0, estoqueMinimo: 5 }),
      produto({ nome: "Suco", quantidade: 20, estoqueMinimo: 5 }),
    ]);

    expect(alertas.map((item) => item.nome)).toEqual(["Agua", "Coca"]);
  });

  it("ordena do mais crítico para o menos crítico", () => {
    const alertas = produtosComAlerta([
      produto({ nome: "Quase ok", quantidade: 9, estoqueMinimo: 10 }),
      produto({ nome: "Critico", quantidade: 1, estoqueMinimo: 10 }),
    ]);

    expect(alertas.map((item) => item.nome)).toEqual(["Critico", "Quase ok"]);
  });
});
