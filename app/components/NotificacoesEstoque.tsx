"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BellRing,
  CircleAlert,
  PackageX,
  X,
} from "lucide-react";
import { useDados } from "@/app/lib/store";
import { produtosComAlerta, statusEstoque } from "@/app/lib/estoque";

function quantidadeComUnidade(quantidade: number, unidade: string) {
  return `${quantidade} ${unidade.toLowerCase()}`;
}

type NotificacoesEstoqueProps = {
  variacao?: "cabecalho" | "menu";
  onNavegar?: () => void;
};

export default function NotificacoesEstoque({
  variacao = "cabecalho",
  onNavegar,
}: NotificacoesEstoqueProps) {
  const { produtos } = useDados();
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const alertas = useMemo(() => produtosComAlerta(produtos), [produtos]);

  // Fecha o painel ao clicar fora ou pressionar Esc.
  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (evento: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(evento.target as Node)
      ) {
        setAberto(false);
      }
    };

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const totalSemEstoque = alertas.filter(
    (produto) => statusEstoque(produto) === "sem"
  ).length;
  const totalBaixo = alertas.length - totalSemEstoque;
  const temAlerta = alertas.length > 0;
  const noMenu = variacao === "menu";

  return (
    <div ref={containerRef} className={noMenu ? "w-full" : "relative shrink-0"}>
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label={
          temAlerta
            ? `${alertas.length} produtos precisam de reposição`
            : "Alertas de estoque"
        }
        aria-haspopup="true"
        aria-expanded={aberto}
        className={
          noMenu
            ? `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                temAlerta
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`
            : `relative p-2 rounded-lg transition-colors ${
                temAlerta
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`
        }
      >
        {temAlerta ? (
          <BellRing className="w-5 h-5 shrink-0" />
        ) : (
          <Bell className="w-5 h-5 shrink-0" />
        )}

        {noMenu ? (
          <>
            <span className="flex-1 text-left font-medium">
              Alertas de estoque
            </span>
            <span
              className={`min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold leading-5 text-center ${
                temAlerta
                  ? "bg-red-600 text-white"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {alertas.length > 99 ? "99+" : alertas.length}
            </span>
          </>
        ) : (
          temAlerta && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold leading-[18px] text-center">
              {alertas.length > 99 ? "99+" : alertas.length}
            </span>
          )
        )}
      </button>

      {aberto && (
        <div
          className={
            noMenu
              ? "mt-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              : "fixed inset-x-3 top-16 z-50 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(22rem,calc(100vw-1.5rem))]"
          }
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Alertas de estoque
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 break-words">
                {temAlerta
                  ? `${totalSemEstoque} sem estoque · ${totalBaixo} com estoque baixo`
                  : "Tudo certo por aqui"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Fechar alertas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={noMenu ? "max-h-56 overflow-y-auto" : "max-h-80 overflow-y-auto"}>
            {temAlerta ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {alertas.map((produto) => {
                  const semEstoque = statusEstoque(produto) === "sem";

                  return (
                    <li
                      key={produto.id}
                      className="px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words leading-snug">
                          {produto.nome}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Mínimo:{" "}
                          {quantidadeComUnidade(
                            produto.estoqueMinimo,
                            produto.unidadeMedida
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          semEstoque
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {semEstoque ? (
                          <PackageX className="w-3 h-3" />
                        ) : (
                          <CircleAlert className="w-3 h-3" />
                        )}
                        {quantidadeComUnidade(
                          produto.quantidade,
                          produto.unidadeMedida
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum produto abaixo do estoque mínimo.
              </p>
            )}
          </div>

          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/estoque"
              onClick={() => {
                setAberto(false);
                onNavegar?.();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Abrir estoque
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
