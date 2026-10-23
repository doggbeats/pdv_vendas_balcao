"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Download,
  FileText,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  FORMAS_PAGAMENTO,
  formatarMoeda,
  formatarNumeroVenda,
  useDados,
  type FormaPagamento,
  type Venda,
} from "@/app/lib/store";

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

function mesDaVenda(data: string) {
  const alvo = new Date(data);
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, "0")}`;
}

function mesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function rotuloMes(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);
  if (!ano || !mesNumero) return mes;
  const texto = new Date(ano, mesNumero - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function dataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function quantidadeItens(venda: Venda) {
  return venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
}

export default function RelatoriosPage() {
  const { vendas, carregado } = useDados();
  const [mes, setMes] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // Define o mês atual apenas no cliente para não bloquear a pré-renderização.
    queueMicrotask(() => setMes((atual) => atual || mesAtual()));
  }, []);

  const vendasDoMes = useMemo(() => {
    return vendas
      .filter((venda) => mesDaVenda(venda.data) === mes)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [vendas, mes]);

  const resumo = useMemo(() => {
    const total = vendasDoMes.reduce((acc, venda) => acc + venda.total, 0);
    const itens = vendasDoMes.reduce(
      (acc, venda) => acc + quantidadeItens(venda),
      0
    );
    const desconto = vendasDoMes.reduce(
      (acc, venda) => acc + venda.desconto,
      0
    );

    const porPagamento = FORMAS_PAGAMENTO.map((opcao) => {
      const vendasDaForma = vendasDoMes.filter(
        (venda) => venda.formaPagamento === opcao.valor
      );
      return {
        ...opcao,
        quantidade: vendasDaForma.length,
        total: vendasDaForma.reduce((acc, venda) => acc + venda.total, 0),
      };
    });

    return {
      total,
      itens,
      desconto,
      transacoes: vendasDoMes.length,
      ticketMedio: vendasDoMes.length > 0 ? total / vendasDoMes.length : 0,
      porPagamento,
    };
  }, [vendasDoMes]);

  if (!mes) {
    return (
      <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Carregando relatórios...
      </div>
    );
  }

  const gerarPdf = async () => {
    if (vendasDoMes.length === 0) return;

    setErro("");
    setGerando(true);

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const larguraPagina = doc.internal.pageSize.getWidth();
      const alturaPagina = doc.internal.pageSize.getHeight();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(24, 24, 27);
      doc.text("Relatório Mensal de Vendas", 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122);
      doc.text(`${rotuloMes(mes)} — CODE_PH Gestão`, 14, 22);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        14,
        27
      );

      doc.setTextColor(24, 24, 27);
      doc.setFontSize(10);
      doc.text(
        `Vendas: ${resumo.transacoes}   |   Itens: ${resumo.itens}   |   Total: ${formatarMoeda(resumo.total)}   |   Ticket médio: ${formatarMoeda(resumo.ticketMedio)}   |   Descontos: ${formatarMoeda(resumo.desconto)}`,
        14,
        35
      );

      const resumoPagamentos = resumo.porPagamento
        .map(
          (pagamento) =>
            `${pagamento.nome}: ${formatarMoeda(pagamento.total)} (${pagamento.quantidade})`
        )
        .join("   |   ");
      doc.setTextColor(113, 113, 122);
      doc.text(resumoPagamentos, 14, 41);

      autoTable(doc, {
        startY: 47,
        head: [
          [
            "Venda",
            "Data/Hora",
            "Produtos",
            "Qtd",
            "Pagamento",
            "Desconto",
            "Total",
          ],
        ],
        body: vendasDoMes.map((venda) => [
          formatarNumeroVenda(venda.numero),
          dataHora(venda.data),
          venda.itens
            .map((item) => `${item.quantidade}x ${item.nome}`)
            .join("\n"),
          String(quantidadeItens(venda)),
          nomePagamento(venda.formaPagamento),
          formatarMoeda(venda.desconto),
          formatarMoeda(venda.total),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: "top",
          textColor: [39, 39, 42],
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 112 },
          3: { cellWidth: 12, halign: "right" },
          4: { cellWidth: 26 },
          5: { cellWidth: 26, halign: "right" },
          6: { cellWidth: 28, halign: "right" },
        },
        margin: { left: 14, right: 14 },
      });

      const totalPaginas = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 150);
        doc.text(
          `Página ${pagina} de ${totalPaginas}`,
          larguraPagina - 14,
          alturaPagina - 8,
          { align: "right" }
        );
      }

      doc.save(`relatorio-vendas-${mes}.pdf`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao gerar o PDF."
      );
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Relatórios
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Relatório mensal de todas as vendas em PDF
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="mes"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Mês
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                id="mes"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={gerarPdf}
            disabled={vendasDoMes.length === 0 || gerando}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {gerando ? "Gerando PDF..." : "Baixar PDF"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {erro}
        </div>
      )}

      {carregado && vendasDoMes.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Receipt className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Nenhuma venda em {rotuloMes(mes)}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Escolha outro mês ou{" "}
            <Link
              href="/vendas"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              registre uma venda
            </Link>
            .
          </p>
        </div>
      )}

      {vendasDoMes.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Total vendido
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatarMoeda(resumo.total)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
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
                    {resumo.transacoes}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Itens vendidos
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {resumo.itens}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Ticket médio
                  </p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatarMoeda(resumo.ticketMedio)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Recebido por forma de pagamento:
              </span>
              {resumo.porPagamento.map((pagamento) => (
                <span
                  key={pagamento.valor}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {pagamento.nome}:{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {formatarMoeda(pagamento.total)}
                  </strong>{" "}
                  ({pagamento.quantidade})
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Vendas de {rotuloMes(mes)}
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {vendasDoMes.length}{" "}
                {vendasDoMes.length === 1 ? "venda" : "vendas"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Venda</th>
                    <th className="px-4 py-3 font-medium">Data/Hora</th>
                    <th className="px-4 py-3 font-medium">Produtos</th>
                    <th className="px-4 py-3 font-medium text-right">Qtd</th>
                    <th className="px-4 py-3 font-medium">Pagamento</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Desconto
                    </th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[...vendasDoMes].reverse().map((venda) => (
                    <tr
                      key={venda.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                        {formatarNumeroVenda(venda.numero)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {dataHora(venda.data)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {venda.itens.map((item) => (
                            <p
                              key={`${venda.id}-${item.produtoId}`}
                              className="text-zinc-900 dark:text-zinc-100"
                            >
                              {item.quantidade}x {item.nome}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {quantidadeItens(venda)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            estilosBadge[venda.formaPagamento]
                          }`}
                        >
                          {nomePagamento(venda.formaPagamento)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {formatarMoeda(venda.desconto)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {formatarMoeda(venda.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
