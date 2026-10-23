"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "OPERADOR";
};

export default function UsuarioCabecalho() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUsuario(d.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  const sair = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (carregando || !usuario) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
        <ShieldCheck className="w-4 h-4" />
        <span className="max-w-[120px] sm:max-w-none truncate">{usuario.nome}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full ${
            usuario.papel === "ADMIN"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {usuario.papel}
        </span>
      </div>
      <button
        type="button"
        onClick={sair}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
}
