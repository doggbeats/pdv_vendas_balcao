"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Truck, X } from "lucide-react";
import {
  atualizarFornecedor,
  combinaBusca,
  criarFornecedor,
  excluirFornecedor,
  useDados,
  type Fornecedor,
} from "@/app/lib/store";

type FormFornecedor = {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
};

const FORM_VAZIO: FormFornecedor = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
};

export default function FornecedoresPage() {
  const { fornecedores, carregado } = useDados();
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<FormFornecedor>(FORM_VAZIO);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores
      .filter((fornecedor) =>
        combinaBusca(
          [
            fornecedor.nome,
            fornecedor.cnpj,
            fornecedor.telefone,
            fornecedor.email,
            fornecedor.endereco,
          ],
          busca
        )
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fornecedores, busca]);

  const alterarCampo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
  };

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro("");
    setMostrarForm(true);
  };

  const abrirEdicao = (fornecedor: Fornecedor) => {
    setEditando(fornecedor);
    setForm({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      endereco: fornecedor.endereco,
      observacoes: fornecedor.observacoes,
    });
    setErro("");
    setMostrarForm(true);
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    try {
      if (editando) {
        atualizarFornecedor({ id: editando.id, ...form });
        setMensagem(`Fornecedor "${form.nome.trim()}" atualizado com sucesso.`);
      } else {
        const fornecedor = criarFornecedor(form);
        setMensagem(
          `Fornecedor "${fornecedor.nome}" cadastrado com sucesso!`
        );
      }
      fecharForm();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao salvar fornecedor."
      );
    }
  };

  const handleExcluir = (fornecedor: Fornecedor) => {
    setErro("");
    setMensagem("");

    if (
      !window.confirm(
        `Excluir o fornecedor "${fornecedor.nome}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      excluirFornecedor(fornecedor.id);
      setMensagem(`Fornecedor "${fornecedor.nome}" excluído.`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao excluir fornecedor."
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Fornecedores
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Cadastre e gerencie os fornecedores da loja
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo fornecedor
        </button>
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

      <div className="relative">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, CNPJ, telefone, e-mail..."
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {!carregado ? (
          <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Carregando...
          </div>
        ) : fornecedoresFiltrados.length === 0 ? (
          <div className="p-10 text-center">
            <Truck className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhum fornecedor encontrado
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {busca
                ? "Ajuste a busca ou cadastre um novo fornecedor."
                : "Cadastre o primeiro fornecedor para começar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CNPJ</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Endereço</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {fornecedoresFiltrados.map((fornecedor) => (
                  <tr
                    key={fornecedor.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {fornecedor.nome}
                      </p>
                      {fornecedor.observacoes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {fornecedor.observacoes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {fornecedor.cnpj || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <p>{fornecedor.telefone || "—"}</p>
                      {fornecedor.email && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {fornecedor.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {fornecedor.endereco || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(fornecedor)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(fornecedor)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={fecharForm}
            aria-hidden="true"
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {editando ? "Editar fornecedor" : "Novo fornecedor"}
              </h2>
              <button
                type="button"
                onClick={fecharForm}
                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="nome"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={form.nome}
                  onChange={alterarCampo}
                  placeholder="Nome ou razão social"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="cnpj"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    CNPJ / CPF
                  </label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    value={form.cnpj}
                    onChange={alterarCampo}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="telefone"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                  >
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="text"
                    value={form.telefone}
                    onChange={alterarCampo}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={alterarCampo}
                  placeholder="contato@fornecedor.com"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endereco"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Endereço
                </label>
                <input
                  id="endereco"
                  name="endereco"
                  type="text"
                  value={form.endereco}
                  onChange={alterarCampo}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="observacoes"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={form.observacoes}
                  onChange={alterarCampo}
                  placeholder="Produtos fornecidos, prazos, condições de pagamento..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={fecharForm}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {editando ? "Salvar alterações" : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
