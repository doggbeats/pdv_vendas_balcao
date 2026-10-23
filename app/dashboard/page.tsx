"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CircleAlert,
  CreditCard,
  DollarSign,
  Package,
  QrCode,
  ShoppingCart,
  Tags,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  FORMAS_PAGAMENTO,
  ehHoje,
  formatarHora,
  formatarMoeda,
  formatarNumeroVenda,
  useDados,
  type FormaPagamento,
} from "@/app/lib/store";
import { produtosComAlerta, statusEstoque } from "@/app/lib/estoque";
import {
  PERIODOS_ANALISE,
  analisarPeriodo,
  type PeriodoAnalise,
  type StatusProdutoVendido,
  type TipoSugestao,
} from "@/app/lib/analise";

const iconesPagamento: Record<FormaPagamento, typeof Banknote> = {
  dinheiro: Banknote,
  cartao: CreditCard,
  pix: QrCode,
};

const coresPagamento: Record<
  FormaPagamento,
  { icone: string; barra: string }
> = {
  dinheiro: {
    icone: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    barra: "bg-green-500",
  },
  cartao: {
    icone: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    barra: "bg-blue-500",
  },
  pix: {
    icone:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    barra: "bg-purple-500",
  },
};

const estilosBadge: Record<FormaPagamento, string> = {
  dinheiro:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cartao:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pix: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function nomePagamento(forma: FormaPagamento) {
  return FORMAS_PAGAMENTO.find((p) => p.valor === forma)?.nome ?? forma;
}

const estilosStatusProduto: Record<StatusProdutoVendido, string> = {
  sem: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  baixo:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ok: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  removido: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const estilosSugestao: Record<TipoSugestao, { rotulo: string; classe: string }> =
  {
    repor: {
      rotulo: "Repor agora",
      classe: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    reforcar: {
      rotulo: "Reforçar compra",
      classe:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    reduzir: {
      rotulo: "Evitar compra",
      classe:
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    },
  };

const CORES_CATEGORIA = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
];

export default function DashboardPage() {
  const {
    vendas,
    produtos,
    categorias: categoriasCadastradas,
    carregado,
  } = useDados();

  const alertasEstoque = produtosComAlerta(produtos);
  const semEstoque = alertasEstoque.filter(
    (produto) => statusEstoque(produto) === "sem"
  ).length;

  const [diasAnalise, setDiasAnalise] = useState<PeriodoAnalise>(30);

  // Só lê a data atual no cliente, depois que os dados carregaram, para não
  // quebrar a pré-renderização da página.
  const analise = useMemo(
    () =>
      carregado
        ? analisarPeriodo(
            vendas,
            produtos,
            categoriasCadastradas,
            diasAnalise
          )
        : analisarPeriodo([], [], [], diasAnalise, new Date(0)),
    [carregado, vendas, produtos, categoriasCadastradas, diasAnalise]
  );

  const produtoMaisVendido = analise.produtos[0] ?? null;
  const maiorFaturamento =
    [...analise.produtos].sort((a, b) => b.faturamento - a.faturamento)[0] ??
    null;
  const categoriaLider = analise.categorias[0] ?? null;
  const focoCompra =
    analise.sugestoes.find(
      (sugestao) => sugestao.tipo === "repor" || sugestao.tipo === "reforcar"
    ) ?? null;
  const maiorFaturamentoCategoria = analise.categorias[0]?.faturamento || 1;

  const vendasHoje = vendas.filter((venda) => ehHoje(venda.data));

  const totalVendas = vendasHoje.reduce((acc, venda) => acc + venda.total, 0);
  const totalItens = vendasHoje.reduce(
    (acc, venda) =>
      acc +
      venda.itens.reduce((soma, item) => soma + item.quantidade, 0),
    0
  );
  const ticketMedio =
    vendasHoje.length > 0 ? totalVendas / vendasHoje.length : 0;

  const porPagamento = FORMAS_PAGAMENTO.map((opcao) => {
    const vendasDaForma = vendasHoje.filter(
      (venda) => venda.formaPagamento === opcao.valor
    );
    return {
      ...opcao,
      quantidade: vendasDaForma.length,
      total: vendasDaForma.reduce((acc, venda) => acc + venda.total, 0),
    };
  });
  const maiorPagamento = Math.max(
    ...porPagamento.map((pagamento) => pagamento.total),
    1
  );

  const vendasRecentes = vendas.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Visão geral das vendas do dia
        </p>
      </div>

      {carregado && alertasEstoque.length > 0 && (
        <Link
          href="/estoque"
          className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition-colors"
        >
          <CircleAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {alertasEstoque.length}{" "}
              {alertasEstoque.length === 1
                ? "produto precisa"
                : "produtos precisam"}{" "}
              de reposição
            </p>
            <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80 truncate">
              {semEstoque > 0 && `${semEstoque} sem estoque · `}
              {alertasEstoque
                .slice(0, 3)
                .map((produto) => produto.nome)
                .join(", ")}
              {alertasEstoque.length > 3
                ? ` e mais ${alertasEstoque.length - 3}`
                : ""}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
            Ver estoque
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Vendas Hoje
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatarMoeda(totalVendas)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Itens Vendidos
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {totalItens}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Transações
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {vendasHoje.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ticket Médio
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatarMoeda(ticketMedio)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Análise do período: o que vende mais e onde investir */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              O que vende mais e onde investir
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {carregado
                ? `${analise.totalVendas} ${
                    analise.totalVendas === 1 ? "venda" : "vendas"
                  } · ${analise.itens} ${
                    analise.itens === 1 ? "item" : "itens"
                  } · ${formatarMoeda(analise.faturamento)} no período`
                : "Analisando as vendas..."}
            </p>
          </div>

          <div className="inline-flex self-start rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5">
            {PERIODOS_ANALISE.map((dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => setDiasAnalise(dias)}
                aria-pressed={diasAnalise === dias}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  diasAnalise === dias
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {dias} dias
              </button>
            ))}
          </div>
        </div>

        {!carregado ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Carregando análise...
          </div>
        ) : analise.totalVendas === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhuma venda nos últimos {diasAnalise} dias
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Registre vendas para ver o que mais sai e onde vale investir.
            </p>
            <Link
              href="/vendas"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ir para vendas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Mais vendido
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                  {produtoMaisVendido?.nome ?? "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {produtoMaisVendido
                    ? `${produtoMaisVendido.quantidade} ${produtoMaisVendido.unidadeMedida.toLowerCase()} vendidas`
                    : "Sem vendas"}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Maior faturamento
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                  {maiorFaturamento?.nome ?? "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {maiorFaturamento
                    ? `${formatarMoeda(
                        maiorFaturamento.faturamento
                      )} · ${maiorFaturamento.participacao.toFixed(0)}% do total`
                    : "Sem vendas"}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Categoria líder
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                  {categoriaLider?.nome ?? "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {categoriaLider
                    ? `${formatarMoeda(
                        categoriaLider.faturamento
                      )} · ${categoriaLider.participacao.toFixed(0)}% do total`
                    : "Sem vendas"}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Foco de compra
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                  {focoCompra?.nome ?? "Estoque equilibrado"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {focoCompra
                    ? `Comprar ~${focoCompra.sugestaoCompra} ${focoCompra.unidadeMedida.toLowerCase()}`
                    : "Nenhuma reposição urgente"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Top 5 produtos
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Por quantidade vendida no período
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      <tr>
                        <th className="px-5 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 font-medium text-right">
                          Qtd
                        </th>
                        <th className="px-3 py-2 font-medium text-right">
                          Faturamento
                        </th>
                        <th className="px-5 py-2 font-medium text-right">
                          Estoque
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {analise.produtos.slice(0, 5).map((item, indice) => (
                        <tr key={item.produtoId}>
                          <td className="px-5 py-3 text-xs text-zinc-400">
                            {indice + 1}
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 break-words leading-snug">
                              {item.nome}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {item.categoriaNome}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                            {item.quantidade}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                            {formatarMoeda(item.faturamento)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {item.estoque === null ||
                            item.status === "removido" ? (
                              <span className="text-xs text-zinc-400">—</span>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                                  estilosStatusProduto[item.status]
                                }`}
                              >
                                {item.estoque}{" "}
                                {item.unidadeMedida.toLowerCase()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Categorias
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Participação no faturamento do período
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {analise.categorias.map((item, indice) => (
                    <div key={item.categoria} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {item.nome}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {formatarMoeda(item.faturamento)} ·{" "}
                          {item.participacao.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-2 rounded-full ${
                            CORES_CATEGORIA[
                              indice % CORES_CATEGORIA.length
                            ] ?? "bg-blue-500"
                          }`}
                          style={{
                            width: `${(item.faturamento / maiorFaturamentoCategoria) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.quantidade}{" "}
                        {item.quantidade === 1 ? "item vendido" : "itens vendidos"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Onde investir
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Sugestões pelo giro dos últimos {diasAnalise} dias e estoque
                    atual
                  </p>
                </div>
                <Link
                  href="/estoque"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver estoque
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {analise.sugestoes.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhuma ação necessária: o estoque está equilibrado com as
                  vendas do período.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {analise.sugestoes.slice(0, 6).map((sugestao) => (
                    <li
                      key={`${sugestao.tipo}-${sugestao.produtoId}`}
                      className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              estilosSugestao[sugestao.tipo].classe
                            }`}
                          >
                            {estilosSugestao[sugestao.tipo].rotulo}
                          </span>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words">
                            {sugestao.nome}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 break-words">
                          {sugestao.motivo}
                        </p>
                      </div>

                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          sugestao.tipo === "reduzir"
                            ? "text-zinc-500 dark:text-zinc-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {sugestao.tipo === "reduzir"
                          ? "Não repor"
                          : `Comprar ~${sugestao.sugestaoCompra} ${sugestao.unidadeMedida.toLowerCase()}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      {/* Recebimentos por Forma de Pagamento */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recebimentos por Forma de Pagamento
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Total recebido em dinheiro, cartão e Pix
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {porPagamento.map((pagamento) => {
            const Icone = iconesPagamento[pagamento.valor];
            const cores = coresPagamento[pagamento.valor];

            return (
              <div
                key={pagamento.valor}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {pagamento.nome}
                    </p>
                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                      {formatarMoeda(pagamento.total)}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${cores.icone}`}
                  >
                    <Icone className="w-5 h-5" />
                  </div>
                </div>

                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {pagamento.quantidade}{" "}
                  {pagamento.quantidade === 1 ? "venda" : "vendas"}
                </p>

                <div className="mt-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                  <div
                    className={`${cores.barra} h-2 rounded-full transition-all`}
                    style={{
                      width: `${(pagamento.total / maiorPagamento) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {carregado && vendasHoje.length === 0 && (
          <p className="px-6 pb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma venda registrada hoje.
          </p>
        )}
      </div>

      {/* Vendas Recentes */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Vendas Recentes
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Últimas transações
          </p>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {vendasRecentes.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            vendasRecentes.map((venda) => {
              const Icone = iconesPagamento[venda.formaPagamento];

              return (
                <div
                  key={venda.id}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {venda.itens.map((item) => item.nome).join(", ")}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            estilosBadge[venda.formaPagamento]
                          }`}
                        >
                          <Icone className="w-3 h-3" />
                          {nomePagamento(venda.formaPagamento)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {formatarNumeroVenda(venda.numero)}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatarHora(venda.data)}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Qtd:{" "}
                          {venda.itens.reduce(
                            (soma, item) => soma + item.quantidade,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatarMoeda(venda.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
