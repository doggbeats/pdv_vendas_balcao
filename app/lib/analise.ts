import type { Categoria, Produto, Venda } from "./store";
import { nomeCategoria } from "./store";
import { statusEstoque } from "./estoque";

export const PERIODOS_ANALISE = [7, 15, 30] as const;

export type PeriodoAnalise = (typeof PERIODOS_ANALISE)[number];

export const META_DIAS_REPOSICAO = 15;
export const META_DIAS_REFORCO = 30;
export const COBERTURA_CRITICA_DIAS = 7;

export function inicioDoPeriodo(dias: number, agora: Date = new Date()) {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));
  return inicio;
}

type Acumulado = {
  nome: string;
  categoria: string;
  quantidade: number;
  faturamento: number;
};

export type StatusProdutoVendido = "sem" | "baixo" | "ok" | "removido";

export type ProdutoVendido = {
  produtoId: string;
  nome: string;
  categoria: string;
  categoriaNome: string;
  quantidade: number;
  faturamento: number;
  participacao: number;
  estoque: number | null;
  estoqueMinimo: number | null;
  unidadeMedida: string;
  mediaDiaria: number;
  coberturaDias: number | null;
  status: StatusProdutoVendido;
};

export type CategoriaVendida = {
  categoria: string;
  nome: string;
  quantidade: number;
  faturamento: number;
  participacao: number;
};

export type TipoSugestao = "repor" | "reforcar" | "reduzir";

export type SugestaoCompra = {
  produtoId: string;
  nome: string;
  tipo: TipoSugestao;
  motivo: string;
  sugestaoCompra: number;
  metaDias: number;
  unidadeMedida: string;
  coberturaDias: number | null;
  vendidos: number;
  estoque: number;
  faturamento: number;
};

export type AnalisePeriodo = {
  dias: number;
  inicio: Date;
  totalVendas: number;
  faturamento: number;
  itens: number;
  ticketMedio: number;
  produtos: ProdutoVendido[];
  categorias: CategoriaVendida[];
  sugestoes: SugestaoCompra[];
};

const PESO_TIPO: Record<TipoSugestao, number> = {
  repor: 0,
  reforcar: 1,
  reduzir: 2,
};

function motivoRepor(produto: ProdutoVendido, dias: number) {
  const unidade = produto.unidadeMedida.toLowerCase();

  if (produto.status === "sem") {
    return `Sem estoque — vendeu ${produto.quantidade} ${unidade} nos últimos ${dias} dias.`;
  }

  if (produto.status === "baixo") {
    return `No estoque mínimo (${produto.estoque} ${unidade}) — vendeu ${produto.quantidade} ${unidade} no período.`;
  }

  const cobertura = Math.max(0, Math.floor(produto.coberturaDias ?? 0));
  return `Estoque cobre ~${cobertura} dia(s) — vendeu ${produto.quantidade} ${unidade} no período.`;
}

/**
 * Analisa as vendas de um período cruzando o que saiu com o estoque atual.
 * Serve para responder duas perguntas: o que mais vende e onde repor/investir.
 */
export function analisarPeriodo(
  vendas: Venda[],
  produtos: Produto[],
  categorias: Categoria[],
  dias: number,
  agora: Date = new Date()
): AnalisePeriodo {
  const inicio = inicioDoPeriodo(dias, agora);
  const vendasPeriodo = vendas.filter(
    (venda) => new Date(venda.data).getTime() >= inicio.getTime()
  );

  const mapaProdutos = new Map(produtos.map((produto) => [produto.id, produto]));
  const mapaVendidos = new Map<string, Acumulado>();

  for (const venda of vendasPeriodo) {
    for (const item of venda.itens) {
      const atual = mapaVendidos.get(item.produtoId) ?? {
        nome: item.nome,
        categoria: item.categoria,
        quantidade: 0,
        faturamento: 0,
      };

      atual.nome = item.nome;
      atual.categoria = item.categoria;
      atual.quantidade += item.quantidade;
      atual.faturamento += item.valorUnitario * item.quantidade;
      mapaVendidos.set(item.produtoId, atual);
    }
  }

  const faturamentoItens = Array.from(mapaVendidos.values()).reduce(
    (acc, item) => acc + item.faturamento,
    0
  );

  const produtosVendidos: ProdutoVendido[] = Array.from(mapaVendidos.entries())
    .map(([produtoId, dados]): ProdutoVendido => {
      const produto = mapaProdutos.get(produtoId);
      const mediaDiaria = dados.quantidade / Math.max(1, dias);
      const estoque = produto?.quantidade ?? null;
      const coberturaDias =
        estoque !== null && mediaDiaria > 0 ? estoque / mediaDiaria : null;

      return {
        produtoId,
        nome: produto?.nome ?? dados.nome,
        categoria: dados.categoria,
        categoriaNome: nomeCategoria(dados.categoria, categorias),
        quantidade: dados.quantidade,
        faturamento: dados.faturamento,
        participacao:
          faturamentoItens > 0
            ? (dados.faturamento / faturamentoItens) * 100
            : 0,
        estoque,
        estoqueMinimo: produto?.estoqueMinimo ?? null,
        unidadeMedida: produto?.unidadeMedida ?? "UN",
        mediaDiaria,
        coberturaDias,
        status: produto ? statusEstoque(produto) : "removido",
      };
    })
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade ||
        b.faturamento - a.faturamento ||
        a.nome.localeCompare(b.nome, "pt-BR")
    );

  const mapaCategorias = new Map<
    string,
    { quantidade: number; faturamento: number }
  >();

  for (const produto of produtosVendidos) {
    const atual = mapaCategorias.get(produto.categoria) ?? {
      quantidade: 0,
      faturamento: 0,
    };

    atual.quantidade += produto.quantidade;
    atual.faturamento += produto.faturamento;
    mapaCategorias.set(produto.categoria, atual);
  }

  const categoriasVendidas: CategoriaVendida[] = Array.from(
    mapaCategorias.entries()
  )
    .map(([valor, dados]) => ({
      categoria: valor,
      nome: nomeCategoria(valor, categorias),
      quantidade: dados.quantidade,
      faturamento: dados.faturamento,
      participacao:
        faturamentoItens > 0
          ? (dados.faturamento / faturamentoItens) * 100
          : 0,
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  const sugestoes: SugestaoCompra[] = [];

  // 1) Repor o que vendeu e está sem estoque, no mínimo ou com poucos dias de cobertura.
  for (const produto of produtosVendidos) {
    if (produto.estoque === null) continue;

    const cobertura = produto.coberturaDias;
    const precisaRepor =
      produto.status === "sem" ||
      produto.status === "baixo" ||
      (cobertura !== null && cobertura < COBERTURA_CRITICA_DIAS);

    if (!precisaRepor) continue;

    sugestoes.push({
      produtoId: produto.produtoId,
      nome: produto.nome,
      tipo: "repor",
      motivo: motivoRepor(produto, dias),
      sugestaoCompra: Math.max(
        1,
        Math.ceil(produto.mediaDiaria * META_DIAS_REPOSICAO) - produto.estoque
      ),
      metaDias: META_DIAS_REPOSICAO,
      unidadeMedida: produto.unidadeMedida,
      coberturaDias: cobertura,
      vendidos: produto.quantidade,
      estoque: produto.estoque,
      faturamento: produto.faturamento,
    });
  }

  // 2) Reforçar a compra dos campeões de giro com estoque saudável, mas curto.
  const topGiro = new Set(
    produtosVendidos.slice(0, 5).map((produto) => produto.produtoId)
  );
  const jaSugeridos = new Set(sugestoes.map((item) => item.produtoId));

  for (const produto of produtosVendidos) {
    if (
      produto.estoque === null ||
      !topGiro.has(produto.produtoId) ||
      jaSugeridos.has(produto.produtoId) ||
      produto.status !== "ok" ||
      produto.coberturaDias === null ||
      produto.coberturaDias < COBERTURA_CRITICA_DIAS ||
      produto.coberturaDias >= META_DIAS_REFORCO
    ) {
      continue;
    }

    sugestoes.push({
      produtoId: produto.produtoId,
      nome: produto.nome,
      tipo: "reforcar",
      motivo: `Bom giro: ${produto.quantidade} ${produto.unidadeMedida.toLowerCase()} vendidas e estoque para ~${Math.max(1, Math.floor(produto.coberturaDias))} dias.`,
      sugestaoCompra: Math.max(
        1,
        Math.ceil(produto.mediaDiaria * META_DIAS_REFORCO) - produto.estoque
      ),
      metaDias: META_DIAS_REFORCO,
      unidadeMedida: produto.unidadeMedida,
      coberturaDias: produto.coberturaDias,
      vendidos: produto.quantidade,
      estoque: produto.estoque,
      faturamento: produto.faturamento,
    });
  }

  // 3) Sinalizar capital parado: tem estoque, mas não vendeu no período.
  const parados = produtos
    .filter(
      (produto) =>
        !mapaVendidos.has(produto.id) &&
        produto.quantidade > 0 &&
        produto.quantidade > produto.estoqueMinimo
    )
    .sort(
      (a, b) =>
        b.valorCusto * b.quantidade - a.valorCusto * a.quantidade ||
        b.quantidade - a.quantidade
    )
    .slice(0, 3);

  for (const produto of parados) {
    sugestoes.push({
      produtoId: produto.id,
      nome: produto.nome,
      tipo: "reduzir",
      motivo: `Sem vendas nos últimos ${dias} dias e ${produto.quantidade} ${produto.unidadeMedida.toLowerCase()} em estoque.`,
      sugestaoCompra: 0,
      metaDias: 0,
      unidadeMedida: produto.unidadeMedida,
      coberturaDias: null,
      vendidos: 0,
      estoque: produto.quantidade,
      faturamento: 0,
    });
  }

  sugestoes.sort((a, b) => {
    const porTipo = PESO_TIPO[a.tipo] - PESO_TIPO[b.tipo];
    if (porTipo !== 0) return porTipo;

    if (a.tipo === "repor" && b.tipo === "repor") {
      const semEstoqueA = a.estoque === 0 ? 0 : 1;
      const semEstoqueB = b.estoque === 0 ? 0 : 1;
      if (semEstoqueA !== semEstoqueB) return semEstoqueA - semEstoqueB;

      return (
        (a.coberturaDias ?? Infinity) - (b.coberturaDias ?? Infinity) ||
        b.faturamento - a.faturamento
      );
    }

    return b.faturamento - a.faturamento;
  });

  const faturamento = vendasPeriodo.reduce(
    (acc, venda) => acc + venda.total,
    0
  );
  const itens = produtosVendidos.reduce(
    (acc, produto) => acc + produto.quantidade,
    0
  );

  return {
    dias,
    inicio,
    totalVendas: vendasPeriodo.length,
    faturamento,
    itens,
    ticketMedio:
      vendasPeriodo.length > 0 ? faturamento / vendasPeriodo.length : 0,
    produtos: produtosVendidos,
    categorias: categoriasVendidas,
    sugestoes,
  };
}
