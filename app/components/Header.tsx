"use client";

import { Menu, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AvisoEstoque from "./AvisoEstoque";
import NotificacoesEstoque from "./NotificacoesEstoque";
import UsuarioCabecalho from "./UsuarioCabecalho";

type HeaderProps = {
  onAbrirMenu?: () => void;
};

export default function Header({ onAbrirMenu }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    router.push(`/vendas${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenu}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 lg:invisible"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
          </form>

          {/* No mobile, notificações e usuário ficam dentro do menu lateral. */}
          <div className="hidden shrink-0 lg:block">
            <NotificacoesEstoque />
          </div>

          <div className="hidden shrink-0 lg:block">
            <UsuarioCabecalho />
          </div>
        </div>
      </header>

      <AvisoEstoque />
    </>
  );
}
