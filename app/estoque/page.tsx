"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, CircleAlert, CircleCheck, DollarSign, Package, PackageX, Pencil, Search, Trash2, Warehouse, X } from "lucide-react";
import {
  atualizarProduto,
  combinaBusca,
  diasParaVencer,
  estaVencido,
  excluirProduto,
  formatarData,
  formatarMoeda,
  nomeCategoria,
  useDados,
  type Produto,
} from "@/app/lib/store";

type FiltroEstoque = "todos" | "baixo" | "sem";

function statusEstoque(produto: Produto) {
  if (produto.quantidade <= 0) {
    return {
      rotulo: "Sem estoque",
      classe:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  }

  if (produto.quantidade <= produto.estoqueMinimo) {
    return {
      rotulo: "Estoque baixo",
      classe:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
  }

  return {
    rotulo: "Em estoque",
    classe:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
}

export default function EstoquePage() {
  const { produtos, categorias: categoriasCadastradas, carregado } = useDados();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [filtro, setFiltro] = useState<FiltroEstoque>("todos");
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    valorCusto: "",
    valorVenda: "",
    quantidade: "",
    estoqueMinimo: "",
    unidadeMedida: "UN",
    unidadesPorCaixinha: "1",
    especificacao: "",
    validade: "",
  });
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(produtos.map((p) => p.categoria)));
    return unicas.sort((a, b) =>
      nomeCategoria(a, categoriasCadastradas).localeCompare(
        nomeCategoria(b, categoriasCadastradas)
      )
    );
  }, [produtos, categoriasCadastradas]);

  const resumo = useMemo(() => {
    const semEstoque = produtos.filter((p) => p.quantidade <= 0).length;
    const estoqueBaixo = produtos.filter(
      (p) => p.quantidade > 0 && p.quantidade <= p.estoqueMinimo
    ).length;
    const totalItens = produtos.reduce((acc, p) => acc + p.quantidade, 0);
    const valorEstoque = produtos.reduce(
      (acc, p) => acc + p.quantidade * p.valorCusto,
      0
    );

    return {
      totalProdutos: produtos.length,
      totalItens,
      valorEstoque,
      semEstoque,
      estoqueBaixo,
      precisamRepor: semEstoque + estoqueBaixo,
    };
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const combinaBuscaProduto = combinaBusca(
        [
          produto.nome,
          produto.codigo,
          nomeCategoria(produto.categoria, categoriasCadastradas),
        ],
        busca
      );
      const combinaCategoria =
        categoria === "todas" || produto.categoria === categoria;

      const combinaFiltro =
        filtro === "todos" ||
        (filtro === "baixo" &&
          produto.quantidade > 0 &&
          produto.quantidade <= produto.estoqueMinimo) ||
        (filtro === "sem" && produto.quantidade <= 0);

      return combinaBuscaProduto && combinaCategoria && combinaFiltro;
    });
  }, [produtos, busca, categoria, filtro, categoriasCadastradas]);

  const abrirAjuste = (produto: Produto) => {
    setProdutoEditando(produto);
    setForm({
      nome: produto.nome,
      categoria: produto.categoria,
      valorCusto: String(produto.valorCusto),
      valorVenda: String(produto.valorVenda),
      quantidade: String(produto.quantidade),
      estoqueMinimo: String(produto.estoqueMinimo),
      unidadeMedida: produto.unidadeMedida,
      unidadesPorCaixinha: String(produto.unidadesPorCaixinha),
      especificacao: produto.especificacao,
      validade: produto.validade ?? "",
    });
    setErro("");
  };

  const fecharAjuste = () => {
    setProdutoEditando(null);
    setForm({
      nome: "",
      categoria: "",
      valorCusto: "",
      valorVenda: "",
      quantidade: "",
      estoqueMinimo: "",
      unidadeMedida: "UN",
      unidadesPorCaixinha: "1",
      especificacao: "",
      validade: "",
    });
    setErro("");
  };

  const alterarCampo = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((anterior) => {
      const atualizado = { ...anterior, [name]: value };
      // Cerveja em caixinha usa categoria própria para separar os relatórios.
      if (atualizado.unidadeMedida === "CX" && atualizado.categoria === "cervejas") {
        atualizado.categoria = "cervejas-caixinha";
      }
      return atualizado;
    });
  };

  const salvarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;

    setErro("");
    setSucesso("");

    try {
      atualizarProduto({
        id: produtoEditando.id,
        codigo: produtoEditando.codigo,
        nome: form.nome,
        categoria: form.categoria,
        valorCusto: Number(form.valorCusto) || 0,
        valorVenda: Number(form.valorVenda) || 0,
        quantidade: Number(form.quantidade) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        unidadeMedida: form.unidadeMedida,
        unidadesPorCaixinha: Number(form.unidadesPorCaixinha) || 1,
        especificacao: form.especificacao,
        validade: form.validade,
      });
      setSucesso(`Produto "${form.nome}" atualizado com sucesso.`);
      fecharAjuste();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao atualizar produto."
      );
    }
  };

  const excluirProdutoSelecionado = (produto: Produto) => {
    setErro("");
    setSucesso("");

    const confirmado = window.confirm(
      `Excluir o produto "${produto.nome}"?\n\nEssa ação não pode ser desfeita.`
    );

    if (!confirmado) return;

    try {
      excluirProduto(produto.id);
      setSucesso(`Produto "${produto.nome}" excluído.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao excluir produto."
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Estoque
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Controle as quantidades e o estoque mínimo dos produtos
          </p>
        </div>

        <Link
          href="/produtos/cadastro"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          Cadastrar produto
        </Link>
      </div>

      {sucesso && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CircleCheck className="w-4 h-4 mt-0.5 shrink-0" />
            {sucesso}
          </span>
          <button
            type="button"
            onClick={() => setSucesso("")}
            className="text-green-700/70 hover:text-green-800 dark:text-green-400/70 dark:hover:text-green-300"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {erro && !produtoEditando && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            {erro}
          </span>
          <button
            type="button"
            onClick={() => setErro("")}
            className="text-red-700/70 hover:text-red-800 dark:text-red-400/70 dark:hover:text-red-300"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Produtos
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {resumo.totalProdutos}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Itens em estoque
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {resumo.totalItens}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Boxes className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Valor em estoque
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatarMoeda(resumo.valorEstoque)}
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
                Precisam repor
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {resumo.precisamRepor}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {resumo.semEstoque} sem estoque
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <CircleAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, código ou categoria..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((slug) => (
              <option key={slug} value={slug}>
                {nomeCategoria(slug, categoriasCadastradas)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtro === "todos"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            Todos ({produtos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("baixo")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtro === "baixo"
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            Estoque baixo ({resumo.estoqueBaixo})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("sem")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filtro === "sem"
                ? "bg-red-600 border-red-600 text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            Sem estoque ({resumo.semEstoque})
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {carregado && produtosFiltrados.length === 0 ? (
          <div className="p-10 text-center">
            <Warehouse className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhum produto encontrado
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ajuste os filtros ou{" "}
              <Link
                href="/produtos/cadastro"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                cadastre um novo produto
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Estoque</th>
                  <th className="px-4 py-3 font-medium text-right">Mínimo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Valor em estoque
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {produtosFiltrados.map((produto) => {
                  const status = statusEstoque(produto);

                  return (
                    <tr
                      key={produto.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {produto.nome}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {produto.codigo}
                          {produto.unidadeMedida === "CX" &&
                            ` · Caixinha com ${produto.unidadesPorCaixinha} un.`}
                        </p>
                        {produto.validade && (
                          <p
                            className={`text-xs mt-0.5 font-medium ${
                              estaVencido(produto.validade)
                                ? "text-red-600 dark:text-red-400"
                                : (diasParaVencer(produto.validade) ?? 0) <= 30
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            Val.: {formatarData(produto.validade)}
                            {estaVencido(produto.validade)
                              ? " (vencido)"
                              : (diasParaVencer(produto.validade) ?? 0) <= 30
                                ? ` (${diasParaVencer(produto.validade)}d)`
                                : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {nomeCategoria(produto.categoria, categoriasCadastradas)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {produto.quantidade}
                        </span>{" "}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {produto.unidadeMedida.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {produto.estoqueMinimo}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.classe}`}
                        >
                          {produto.quantidade <= 0 ? (
                            <PackageX className="w-3 h-3" />
                          ) : produto.quantidade <= produto.estoqueMinimo ? (
                            <CircleAlert className="w-3 h-3" />
                          ) : (
                            <CircleCheck className="w-3 h-3" />
                          )}
                          {status.rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                        {formatarMoeda(produto.quantidade * produto.valorCusto)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirAjuste(produto)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirProdutoSelecionado(produto)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {produtoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="flex items-start justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Editar produto
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {produtoEditando.codigo}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharAjuste}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarAjuste} className="p-5 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="nome"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={form.nome}
                  onChange={alterarCampo}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="categoria"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    required
                    value={form.categoria}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {categoriasCadastradas.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="unidadeMedida"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Unidade de medida
                  </label>
                  <select
                    id="unidadeMedida"
                    name="unidadeMedida"
                    value={form.unidadeMedida}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="FD">FD - Fardo</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="valorCusto"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Valor de custo (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="valorCusto"
                    name="valorCusto"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.valorCusto}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="valorVenda"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Valor de venda (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="valorVenda"
                    name="valorVenda"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.valorVenda}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="quantidade"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Quantidade em estoque
                  </label>
                  <input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.quantidade}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="estoqueMinimo"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Estoque mínimo
                  </label>
                  <input
                    id="estoqueMinimo"
                    name="estoqueMinimo"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.estoqueMinimo}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {form.unidadeMedida === "CX" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="unidadesPorCaixinha"
                      className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                    >
                      Unidades por caixinha
                    </label>
                    <input
                      id="unidadesPorCaixinha"
                      name="unidadesPorCaixinha"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={form.unidadesPorCaixinha}
                      onChange={alterarCampo}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="validade"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Validade
                  </label>
                  <input
                    id="validade"
                    name="validade"
                    type="date"
                    value={form.validade}
                    onChange={alterarCampo}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="especificacao"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Especificação
                </label>
                <textarea
                  id="especificacao"
                  name="especificacao"
                  rows={3}
                  value={form.especificacao}
                  onChange={alterarCampo}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                  {erro}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={fecharAjuste}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
