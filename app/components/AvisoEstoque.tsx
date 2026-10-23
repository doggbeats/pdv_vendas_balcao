"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, PackageX, X } from "lucide-react";
import { useDados } from "@/app/lib/store";
import { produtosComAlerta, statusEstoque } from "@/app/lib/estoque";

function quantidadeComUnidade(quantidade: number, unidade: string) {
  return `${quantidade} ${unidade.toLowerCase()}`;
}

export default function AvisoEstoque() {
  const { produtos, carregado } = useDados();
  const [toasts, setToasts] = useState<string[]>([]);
  const alertasAnteriores = useRef<Set<string> | null>(null);

  const alertas = useMemo(() => produtosComAlerta(produtos), [produtos]);

  // Detecta produtos que acabaram de entrar em alerta (por exemplo, depois de
  // uma venda) e mostra o aviso. Na primeira carga não dispara nada.
  useEffect(() => {
    if (!carregado) return;

    const idsAtuais = new Set(alertas.map((produto) => produto.id));
    const anteriores = alertasAnteriores.current;
    alertasAnteriores.current = idsAtuais;

    if (!anteriores) return;

    const novos = alertas
      .filter((produto) => !anteriores.has(produto.id))
      .map((produto) => produto.id);

    setToasts((ids) => {
      const mantidos = ids.filter(
        (id) => idsAtuais.has(id) && !novos.includes(id)
      );

      if (novos.length === 0 && mantidos.length === ids.length) {
        return ids;
      }

      return [...mantidos, ...novos];
    });
  }, [carregado, alertas]);

  const produtosDoAviso = useMemo(
    () => alertas.filter((produto) => toasts.includes(produto.id)),
    [alertas, toasts]
  );

  const avisoTemSemEstoque = produtosDoAviso.some(
    (produto) => statusEstoque(produto) === "sem"
  );

  if (produtosDoAviso.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-96 z-[60]"
    >
      <div
        className={`rounded-lg border bg-white dark:bg-zinc-900 shadow-xl p-4 ${
          avisoTemSemEstoque
            ? "border-red-300 dark:border-red-900"
            : "border-amber-300 dark:border-amber-900"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
              avisoTemSemEstoque
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {avisoTemSemEstoque ? (
              <PackageX className="w-5 h-5" />
            ) : (
              <CircleAlert className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {avisoTemSemEstoque ? "Produto sem estoque" : "Estoque baixo"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Reponha para não perder vendas.
            </p>

            <ul className="mt-2 space-y-1">
              {produtosDoAviso.slice(0, 3).map((produto) => (
                <li
                  key={produto.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="min-w-0 break-words text-zinc-700 dark:text-zinc-300">
                    {produto.nome}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${
                      statusEstoque(produto) === "sem"
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {quantidadeComUnidade(
                      produto.quantidade,
                      produto.unidadeMedida
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {produtosDoAviso.length > 3 && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                +{produtosDoAviso.length - 3}{" "}
                {produtosDoAviso.length - 3 === 1
                  ? "outro produto"
                  : "outros produtos"}
              </p>
            )}

            <Link
              href="/estoque"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver estoque
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setToasts([])}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
            aria-label="Fechar aviso de estoque"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
