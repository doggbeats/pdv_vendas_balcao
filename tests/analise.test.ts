import { describe, expect, it } from "vitest";
import type { Produto, Venda } from "@/app/lib/store";
import { analisarPeriodo, inicioDoPeriodo } from "@/app/lib/analise";

const agora = new Date(2026, 9, 22, 12, 0, 0); // 22/10/2026 12:00 (horário local)

function produto(parcial: Partial<Produto> & Pick<Produto, "nome">): Produto {
  return {
    id: parcial.nome.toLowerCase().replace(/\s+/g, "-"),
    codigo: "PROD-TESTE",
    categoria: "cervejas",
    valorCusto: 1,
    valorVenda: 2,
    quantidade: 100,
    estoqueMinimo: 5,
    unidadeMedida: "UN",
    unidadesPorCaixinha: 1,
    especificacao: "",
    validade: "",
    ...parcial,
  };
}

let numeroVenda = 1;

function venda(
  data: Date,
  itens: Array<{
    produto: Produto;
    quantidade: number;
    valorUnitario?: number;
  }>
): Venda {
  const itensVenda = itens.map(({ produto, quantidade, valorUnitario }) => ({
    produtoId: produto.id,
    codigo: produto.codigo,
    nome: produto.nome,
    categoria: produto.categoria,
    valorUnitario: valorUnitario ?? produto.valorVenda,
    quantidade,
  }));

  const subtotal = itensVenda.reduce(
    (acc, item) => acc + item.valorUnitario * item.quantidade,
    0
  );

  return {
    id: `venda-${numeroVenda}`,
    numero: numeroVenda++,
    data: data.toISOString(),
    itens: itensVenda,
    subtotal,
    desconto: 0,
    total: subtotal,
    formaPagamento: "dinheiro",
    valorRecebido: subtotal,
    troco: 0,
  };
}

describe("inicioDoPeriodo", () => {
  it("começa à meia-noite do primeiro dia do período, incluindo hoje", () => {
    const inicio = inicioDoPeriodo(7, agora);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.getDate()).toBe(16);
    expect(inicio.getMonth()).toBe(9);
  });
});

describe("analisarPeriodo", () => {
  it("considera apenas as vendas do período", () => {
    const skol = produto({ nome: "Skol", quantidade: 50 });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [{ produto: skol, quantidade: 2 }]),
      venda(new Date(2026, 8, 1, 12), [{ produto: skol, quantidade: 3 }]),
    ];

    const analise = analisarPeriodo(vendas, [skol], [], 7, agora);

    expect(analise.totalVendas).toBe(1);
    expect(analise.produtos[0].quantidade).toBe(2);
  });

  it("ordena os produtos por quantidade vendida", () => {
    const brahma = produto({ nome: "Brahma" });
    const skol = produto({ nome: "Skol" });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [{ produto: brahma, quantidade: 10 }]),
      venda(new Date(2026, 9, 21, 12), [{ produto: skol, quantidade: 3 }]),
    ];

    const analise = analisarPeriodo(vendas, [brahma, skol], [], 7, agora);

    expect(analise.produtos.map((item) => item.nome)).toEqual([
      "Brahma",
      "Skol",
    ]);
    expect(analise.produtos[0].faturamento).toBe(20);
    expect(
      analise.produtos.reduce((acc, item) => acc + item.participacao, 0)
    ).toBeCloseTo(100);
  });

  it("agrupa as categorias por faturamento", () => {
    const cerveja = produto({ nome: "Cerveja", categoria: "cervejas" });
    const refrigerante = produto({
      nome: "Refrigerante",
      categoria: "refrigerantes",
      valorVenda: 8,
    });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [
        { produto: cerveja, quantidade: 10, valorUnitario: 5 },
        { produto: refrigerante, quantidade: 4 },
      ]),
    ];

    const analise = analisarPeriodo(
      vendas,
      [cerveja, refrigerante],
      [],
      7,
      agora
    );

    expect(analise.categorias.map((item) => item.nome)).toEqual([
      "Cervejas (Unidade)",
      "Refrigerantes",
    ]);
    expect(analise.categorias[0].faturamento).toBe(50);
  });

  it("sugere reposição para produto sem estoque que vendeu", () => {
    const skol = produto({ nome: "Skol", quantidade: 0, estoqueMinimo: 5 });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [{ produto: skol, quantidade: 7 }]),
    ];

    const analise = analisarPeriodo(vendas, [skol], [], 7, agora);
    const sugestao = analise.sugestoes[0];

    expect(sugestao.tipo).toBe("repor");
    expect(sugestao.motivo).toContain("Sem estoque");
    expect(sugestao.sugestaoCompra).toBeGreaterThanOrEqual(1);
  });

  it("reforça a compra de produto com bom giro e estoque curto", () => {
    const skol = produto({ nome: "Skol", quantidade: 20, estoqueMinimo: 5 });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [{ produto: skol, quantidade: 10 }]),
    ];

    const analise = analisarPeriodo(vendas, [skol], [], 7, agora);
    const sugestao = analise.sugestoes[0];

    expect(sugestao.tipo).toBe("reforcar");
    expect(sugestao.metaDias).toBe(30);
    expect(sugestao.sugestaoCompra).toBeGreaterThan(0);
  });

  it("sinaliza produto parado que não vendeu no período", () => {
    const skol = produto({ nome: "Skol" });
    const parado = produto({
      nome: "Whisky parado",
      quantidade: 100,
      estoqueMinimo: 5,
    });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [{ produto: skol, quantidade: 2 }]),
    ];

    const analise = analisarPeriodo(vendas, [skol, parado], [], 30, agora);
    const sugestao = analise.sugestoes.find(
      (item) => item.produtoId === parado.id
    );

    expect(sugestao?.tipo).toBe("reduzir");
    expect(sugestao?.sugestaoCompra).toBe(0);
    expect(sugestao?.motivo).toContain("Sem vendas");
  });

  it("lida com produto que foi removido do cadastro", () => {
    const removido = produto({ nome: "Produto antigo" });
    const vendas = [
      venda(new Date(2026, 9, 20, 12), [
        { produto: removido, quantidade: 4 },
      ]),
    ];

    const analise = analisarPeriodo(vendas, [], [], 7, agora);

    expect(analise.produtos[0].status).toBe("removido");
    expect(analise.produtos[0].estoque).toBeNull();
    expect(analise.sugestoes).toHaveLength(0);
  });
});
