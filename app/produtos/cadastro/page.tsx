"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { criarCategoria, criarProduto, useDados } from "@/app/lib/store";

function gerarCodigo() {
  return (
    "PROD-" +
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 5).toUpperCase()
  );
}

export default function CadastroProdutoPage() {
  const { categorias } = useDados();
  const [formData, setFormData] = useState({
    codigo: "",
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [erroCategoria, setErroCategoria] = useState("");
  const [mensagemCategoria, setMensagemCategoria] = useState("");

  const handleCriarCategoria = () => {
    setErroCategoria("");
    setMensagemCategoria("");

    try {
      const categoria = criarCategoria(novaCategoria);
      setFormData((prev) => ({ ...prev, categoria: categoria.valor }));
      setNovaCategoria("");
      setMostrarNovaCategoria(false);
      setMensagemCategoria(
        `Categoria "${categoria.nome}" criada e selecionada.`
      );
    } catch (error) {
      setErroCategoria(
        error instanceof Error ? error.message : "Erro ao criar categoria."
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const atualizado = { ...prev, [name]: value };
      // Cerveja em caixinha usa categoria própria para separar os relatórios.
      if (atualizado.unidadeMedida === "CX" && atualizado.categoria === "cervejas") {
        atualizado.categoria = "cervejas-caixinha";
      }
      return atualizado;
    });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removerFoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagemSucesso("");
    setMensagemCategoria("");
    setErroCategoria("");

    try {
      criarProduto({
        codigo: formData.codigo || gerarCodigo(),
        nome: formData.nome.trim(),
        categoria: formData.categoria,
        valorCusto: Number(formData.valorCusto) || 0,
        valorVenda: Number(formData.valorVenda) || 0,
        quantidade: Number(formData.quantidade) || 0,
        estoqueMinimo: Number(formData.estoqueMinimo) || 0,
        unidadeMedida: formData.unidadeMedida,
        unidadesPorCaixinha:
          formData.unidadeMedida === "CX"
            ? Number(formData.unidadesPorCaixinha) || 1
            : 1,
        especificacao: formData.especificacao.trim(),
        validade: formData.validade,
      });

      setMensagemSucesso("Produto cadastrado com sucesso!");
      setFormData({
        codigo: "",
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
      removerFoto();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao cadastrar produto."
      );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Cadastro de Produtos
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Cadastre novos produtos para o sistema PDV
        </p>
      </div>

      {mensagemSucesso && (
        <div className="mb-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {mensagemSucesso}{" "}
          <Link href="/vendas" className="font-medium underline">
            Ir para vendas
          </Link>
        </div>
      )}

      {erro && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Foto */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                Imagem do Produto
              </h2>
              {previewUrl ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Camera className="w-10 h-10 mb-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Adicionar foto
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    PNG, JPG até 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Coluna Direita - Dados */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                Informações Gerais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Código
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    readOnly
                    placeholder="Gerado automaticamente ao salvar"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nome do Produto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    placeholder="Digite o nome do produto"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarNovaCategoria((aberto) => !aberto);
                        setErroCategoria("");
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {mostrarNovaCategoria ? "Cancelar" : "+ Nova categoria"}
                    </button>
                  </div>

                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.valor} value={categoria.valor}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>

                  {mostrarNovaCategoria && (
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-2">
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Criar nova categoria
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={novaCategoria}
                          onChange={(e) => setNovaCategoria(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCriarCategoria();
                            }
                          }}
                          autoFocus
                          placeholder="Ex.: Salgados, Doces, Água..."
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleCriarCategoria}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                  )}

                  {erroCategoria && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {erroCategoria}
                    </p>
                  )}

                  {mensagemCategoria && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {mensagemCategoria}
                    </p>
                  )}

                  <Link
                    href="/categorias"
                    className="inline-block text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:underline"
                  >
                    Gerenciar categorias
                  </Link>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Unidade de Medida
                  </label>
                  <select
                    name="unidadeMedida"
                    value={formData.unidadeMedida}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="FD">FD - Fardo</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                  </select>
                </div>

                {formData.unidadeMedida === "CX" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Unidades por Caixinha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="unidadesPorCaixinha"
                      value={formData.unidadesPorCaixinha}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Ex.: 12"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Quantidade de unidades que vem em cada caixinha.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Validade
                  </label>
                  <input
                    type="date"
                    name="validade"
                    value={formData.validade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Data de validade do produto (opcional).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                Valores e Estoque
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Valor de Custo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      R$
                    </span>
                    <input
                      type="number"
                      name="valorCusto"
                      value={formData.valorCusto}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Valor de Venda <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                      R$
                    </span>
                    <input
                      type="number"
                      name="valorVenda"
                      value={formData.valorVenda}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Quantidade em Estoque <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    value={formData.quantidade}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    name="estoqueMinimo"
                    value={formData.estoqueMinimo}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                Especificação
              </h2>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descrição / Especificação do Produto
                </label>
                <textarea
                  name="especificacao"
                  value={formData.especificacao}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Adicione detalhes como marca, modelo, volume, composição ou outras informações relevantes..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
