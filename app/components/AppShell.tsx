"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  // A tela de login fica fora do shell do sistema (sem header/sidebar).
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="h-[63px] border-b border-zinc-200 dark:border-zinc-800" />
        }
      >
        <Header onAbrirMenu={() => setMenuAberto(true)} />
      </Suspense>

      <div className="flex flex-1 min-h-0">
        <Sidebar aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </>
  );
}
