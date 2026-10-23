"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import {
  FORMAS_PAGAMENTO,
  combinaBusca,
  ehHoje,
  excluirVenda,
  formatarHora,
  formatarMoeda,
  formatarNumeroVenda,
  nomeCategoria,
  registrarVenda,
  useDados,
  type FormaPagamento,
  type ItemVenda,
  type Produto,
  type Venda,
} from "@/app/lib/store";

const ICONES_PAGAMENTO: Record<FormaPagamento, typeof Banknote> = {
  dinheiro: Banknote,
  cartao: CreditCard,
  pix: QrCode,
};

function identificadorVenda(venda: Venda) {
  return formatarNumeroVenda(venda.numero);
}

export default function VendasPage() {
  const { produtos, categorias, vendas, carregado } = useDados();

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [desconto, setDesconto] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("dinheiro");
  const [valorRecebido, setValorRecebido] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [vendaParaExcluir, setVendaParaExcluir] = useState<Venda | null>(null);

  const categoriasDisponiveis = useMemo(() => {
    const valores = Array.from(new Set(produtos.map((p) => p.categoria)));
    return valores.sort((a, b) =>
      nomeCategoria(a, categorias).localeCompare(nomeCategoria(b, categorias))
    );
  }, [produtos, categorias]);

  const produtosFiltrados = useMemo(() => {
    return produtos
      .filter((produto) => {
        if (categoriaFiltro !== "todas" && produto.categoria !== categoriaFiltro) {
          return false;
        }
        return combinaBusca(
          [
            produto.nome,
            produto.codigo,
            nomeCategoria(produto.categoria, categorias),
          ],
          busca
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca, categoriaFiltro, categorias]);

  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (total, item) => total + item.valorUnitario * item.quantidade,
        0
      ),
    [carrinho]
  );

  const descontoNumero = Math.min(
    Math.max(Number(desconto.replace(",", ".")) || 0, 0),
    subtotal
  );
  const total = subtotal - descontoNumero;
  const valorRecebidoNumero =
    Number(valorRecebido.replace(",", ".")) || 0;
  const recebido =
    formaPagamento === "dinheiro"
      ? valorRecebido.trim()
        ? Math.max(valorRecebidoNumero, 0)
        : total
      : total;
  const troco = Math.max(recebido - total, 0);
  const itensNoCarrinho = carrinho.reduce(
    (quantidade, item) => quantidade + item.quantidade,
    0
  );

  const vendasOrdenadas = useMemo(
    () =>
      [...vendas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      ),
    [vendas]
  );

  const vendasHoje = vendasOrdenadas.filter((venda) => ehHoje(venda.data));
  const totalHoje = vendasHoje.reduce((acc, venda) => acc + venda.total, 0);

  function produtoPorId(produtoId: string): Produto | undefined {
    return produtos.find((produto) => produto.id === produtoId);
  }

  function adicionarProduto(produto: Produto) {
    setErro("");
    setSucesso("");

    if (produto.quantidade <= 0) {
      setErro(`"${produto.nome}" está sem estoque.`);
      return;
    }

    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produtoId === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.quantidade) {
          setErro(
            `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade}.`
          );
          return atual;
        }
        return atual.map((item) =>
          item.produtoId === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [
        ...atual,
        {
          produtoId: produto.id,
          codigo: produto.codigo,
          nome: produto.nome,
          categoria: produto.categoria,
          valorUnitario: produto.valorVenda,
          quantidade: 1,
        },
      ];
    });
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setErro("");
    setCarrinho((atual) =>
      atual
        .map((item) => {
          if (item.produtoId !== produtoId) return item;

          const produto = produtoPorId(produtoId);
          const limite = produto?.quantidade ?? item.quantidade;
          const novaQuantidade = Math.min(
            Math.max(item.quantidade + delta, 0),
            limite
          );

          if (delta > 0 && item.quantidade >= limite) {
            setErro(`Estoque máximo disponível: ${limite}.`);
          }

          return { ...item, quantidade: novaQuantidade };
        })
        .filter((item) => item.quantidade > 0)
    );
  }

  function removerItem(produtoId: string) {
    setCarrinho((atual) =>
      atual.filter((item) => item.produtoId !== produtoId)
    );
  }

  function limparCarrinho() {
    setCarrinho([]);
    setDesconto("");
    setValorRecebido("");
    setErro("");
  }

  function finalizarVenda() {
    setErro("");
    setSucesso("");

    if (carrinho.length === 0) {
      setErro("Adicione ao menos um produto ao carrinho.");
      return;
    }

    if (formaPagamento === "dinheiro" && recebido < total) {
      setErro("O valor recebido é menor que o total da venda.");
      return;
    }

    try {
      registrarVenda({
        itens: carrinho,
        desconto: descontoNumero,
        formaPagamento,
        valorRecebido: formaPagamento === "dinheiro" ? recebido : total,
      });

      setSucesso(`Venda de ${formatarMoeda(total)} registrada com sucesso.`);
      limparCarrinho();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao registrar venda.");
    }
  }

  function confirmarExclusao() {
    if (!vendaParaExcluir) return;

    try {
      excluirVenda(vendaParaExcluir.id);
      setSucesso(
        `Venda ${identificadorVenda(vendaParaExcluir)} excluída. Produtos devolvidos ao estoque.`
      );
      setErro("");
      setVendaParaExcluir(null);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao excluir a venda."
      );
      setVendaParaExcluir(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Vender
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Selecione os produtos, confira o carrinho e finalize a venda
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Vendas hoje
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatarMoeda(totalHoje)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pedidos</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {vendasHoje.length}
            </p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto por nome ou código..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="todas">Todas as categorias</option>
              {categoriasDisponiveis.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {nomeCategoria(categoria, categorias)}
                </option>
              ))}
            </select>
          </div>

          {!carregado ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Carregando produtos...
            </p>
          ) : produtosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
              <ShoppingCart className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Nenhum produto encontrado.
              </p>
              <Link
                href="/produtos/cadastro"
                className="mt-2 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Cadastrar produto
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {produtosFiltrados.map((produto) => {
                const semEstoque = produto.quantidade <= 0;
                const noCarrinho = carrinho.find(
                  (item) => item.produtoId === produto.id
                );

                return (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => adicionarProduto(produto)}
                    disabled={semEstoque}
                    className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-emerald-400 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed relative"
                  >
                    {noCarrinho && (
                      <span className="absolute top-2 right-2 min-w-6 h-6 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">
                        {noCarrinho.quantidade}
                      </span>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {produto.codigo} ·{" "}
                      {nomeCategoria(produto.categoria, categorias)}
                    </p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {produto.nome}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatarMoeda(produto.valorVenda)}
                      </span>
                      <span
                        className={`text-xs ${
                          semEstoque
                            ? "text-red-600 dark:text-red-400"
                            : produto.quantidade <= produto.estoqueMinimo
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {semEstoque
                          ? "Sem estoque"
                          : `${produto.quantidade} em estoque`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Carrinho
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({itensNoCarrinho} {itensNoCarrinho === 1 ? "item" : "itens"})
              </span>
            </div>
            {carrinho.length > 0 && (
              <button
                type="button"
                onClick={limparCarrinho}
                className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {carrinho.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Receipt className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Clique nos produtos para adicionar ao carrinho.
                </p>
              </div>
            ) : (
              carrinho.map((item) => (
                <div key={item.produtoId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.nome}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatarMoeda(item.valorUnitario)} / un.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerItem(item.produtoId)}
                      aria-label={`Remover ${item.nome}`}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.produtoId, -1)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.quantidade}
                      </span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.produtoId, 1)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatarMoeda(item.valorUnitario * item.quantidade)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatarMoeda(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label
                htmlFor="desconto"
                className="text-zinc-600 dark:text-zinc-400"
              >
                Desconto (R$)
              </label>
              <input
                id="desconto"
                type="number"
                min="0"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0,00"
                className="w-28 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-right text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-between text-base font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatarMoeda(total)}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Forma de pagamento
              </p>
              <div className="grid grid-cols-3 gap-2">
                {FORMAS_PAGAMENTO.map((forma) => {
                  const Icone = ICONES_PAGAMENTO[forma.valor];
                  const ativa = formaPagamento === forma.valor;
                  return (
                    <button
                      key={forma.valor}
                      type="button"
                      onClick={() => {
                        setFormaPagamento(forma.valor);
                        setErro("");
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        ativa
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icone className="w-4 h-4" />
                      {forma.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {formaPagamento === "dinheiro" && (
              <div className="space-y-1">
                <label
                  htmlFor="recebido"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  Valor recebido (R$)
                </label>
                <input
                  id="recebido"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder={total.toFixed(2)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Troco</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatarMoeda(troco)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={finalizarVenda}
              disabled={carrinho.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar venda
            </button>
          </div>
        </aside>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Histórico de vendas
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ao excluir uma venda, o valor sai do caixa e dos relatórios e os
              produtos voltam ao estoque.
            </p>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {carregado ? `${vendasOrdenadas.length} venda(s)` : "Carregando..."}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Venda
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Horário
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Itens
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Pagamento
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Total
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {vendasOrdenadas.slice(0, 30).map((venda) => (
                  <tr key={venda.id}>
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {identificadorVenda(venda)}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(venda.data).toLocaleDateString("pt-BR")} às{" "}
                      {formatarHora(venda.data)}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      <span
                        title={venda.itens
                          .map((item) => `${item.quantidade}x ${item.nome}`)
                          .join(", ")}
                      >
                        {venda.itens.reduce(
                          (quantidade, item) => quantidade + item.quantidade,
                          0
                        )}{" "}
                        item(ns)
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 capitalize">
                      {venda.formaPagamento}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatarMoeda(venda.total)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setVendaParaExcluir(venda)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {carregado && vendasOrdenadas.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {vendaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setVendaParaExcluir(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-50 dark:bg-red-950/30 p-2 text-red-600 dark:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Excluir venda {identificadorVenda(vendaParaExcluir)}?
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Esta ação remove a venda de{" "}
                    {formatarMoeda(vendaParaExcluir.total)} do caixa e dos
                    relatórios, e devolve os produtos ao estoque.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                {vendaParaExcluir.itens
                  .map((item) => `${item.quantidade}x ${item.nome}`)
                  .join(" · ")}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVendaParaExcluir(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  Excluir venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
