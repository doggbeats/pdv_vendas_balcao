"use client";

import { useMemo, useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import {
  criarCategoria,
  removerCategoria,
  useDados,
} from "@/app/lib/store";

export default function CategoriasPage() {
  const { categorias, produtos, carregado } = useDados();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const contagemPorCategoria = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const produto of produtos) {
      contagem.set(
        produto.categoria,
        (contagem.get(produto.categoria) ?? 0) + 1
      );
    }

    return contagem;
  }, [produtos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    try {
      const categoria = criarCategoria(nome);
      setNome("");
      setMensagem(`Categoria "${categoria.nome}" adicionada com sucesso!`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao adicionar categoria."
      );
    }
  };

  const handleRemover = (valor: string, nomeCategoriaAtual: string) => {
    setErro("");
    setMensagem("");

    if (
      !window.confirm(
        `Excluir a categoria "${nomeCategoriaAtual}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      removerCategoria(valor);
      setMensagem(`Categoria "${nomeCategoriaAtual}" excluída.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao excluir categoria."
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Categorias
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Adicione e organize as categorias dos produtos
        </p>
      </div>

      {mensagem && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Nova categoria
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Salgados, Doces, Água..."
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Categorias cadastradas
          </h2>
        </div>

        {!carregado ? (
          <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Carregando...
          </div>
        ) : categorias.length === 0 ? (
          <div className="p-10 text-center">
            <Tags className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Nenhuma categoria cadastrada.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {categorias.map((categoria) => {
              const quantidade = contagemPorCategoria.get(categoria.valor) ?? 0;
              const emUso = quantidade > 0;

              return (
                <li
                  key={categoria.valor}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {categoria.nome}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {quantidade} produto{quantidade === 1 ? "" : "s"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemover(categoria.valor, categoria.nome)
                    }
                    disabled={emUso}
                    title={
                      emUso
                        ? "Não é possível excluir uma categoria em uso."
                        : `Excluir ${categoria.nome}`
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
