"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import NotificacoesEstoque from "./NotificacoesEstoque";
import UsuarioCabecalho from "./UsuarioCabecalho";

type MenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  destaque?: boolean;
};

const mainItems: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vender", href: "/vendas", icon: ShoppingCart, destaque: true },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Fornecedores", href: "/fornecedores", icon: Truck },
  { name: "Cadastro de Produtos", href: "/produtos/cadastro", icon: PlusCircle },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
];

type SidebarProps = {
  aberto?: boolean;
  onFechar?: () => void;
};

function Navegacao({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="p-2">
      <ul className="space-y-1">
        {mainItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onNavegar}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${
                  item.destaque
                    ? "bg-green-600 text-white hover:bg-green-700 rounded-md"
                    : isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 ${
                      item.destaque
                        ? "text-white"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm ${
                    item.destaque
                      ? "text-white font-medium"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Sidebar({ aberto = false, onFechar }: SidebarProps) {
  return (
    <>
      {/* Menu lateral fixo (desktop) */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-63px)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto shrink-0">
        <Navegacao />
      </aside>

      {/* Menu mobile (drawer) */}
      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onFechar}
            aria-hidden="true"
          />

          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Menu
              </span>
              <button
                type="button"
                onClick={onFechar}
                className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Navegacao onNavegar={onFechar} />
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800">
              <div className="max-h-[55vh] overflow-y-auto p-2">
                <NotificacoesEstoque variacao="menu" onNavegar={onFechar} />
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
                <UsuarioCabecalho variacao="menu" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
