"use client";

import {
  Banknote,
  CreditCard,
  DollarSign,
  Package,
  QrCode,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  FORMAS_PAGAMENTO,
  ehHoje,
  formatarHora,
  formatarMoeda,
  formatarNumeroVenda,
  nomeCategoria,
  useDados,
  type FormaPagamento,
} from "@/app/lib/store";

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

export default function DashboardPage() {
  const { vendas, categorias: categoriasCadastradas, carregado } = useDados();

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

  const categorias = new Map<string, { quantidade: number; total: number }>();
  for (const venda of vendasHoje) {
    for (const item of venda.itens) {
      const atual = categorias.get(item.categoria) ?? {
        quantidade: 0,
        total: 0,
      };
      categorias.set(item.categoria, {
        quantidade: atual.quantidade + item.quantidade,
        total: atual.total + item.valorUnitario * item.quantidade,
      });
    }
  }

  const vendasPorCategoria = Array.from(categorias.entries())
    .map(([slug, dados]) => ({
      categoria: nomeCategoria(slug, categoriasCadastradas),
      ...dados,
    }))
    .sort((a, b) => b.total - a.total);
  const maiorCategoria = Math.max(
    ...vendasPorCategoria.map((categoria) => categoria.total),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Categoria */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Vendas por Categoria
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Quantidade e valor vendido
            </p>
          </div>
          <div className="p-6 space-y-4">
            {vendasPorCategoria.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma venda registrada hoje.
              </p>
            ) : (
              vendasPorCategoria.map((item) => (
                <div key={item.categoria} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.categoria}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatarMoeda(item.total)}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                        ({item.quantidade} un)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(item.total / maiorCategoria) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
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
    </div>
  );
}
