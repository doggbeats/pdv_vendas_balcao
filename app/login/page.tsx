"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";

function destinoSeguro() {
  const destino = new URLSearchParams(window.location.search).get("next");

  if (!destino || !destino.startsWith("/") || destino.startsWith("//")) {
    return "/dashboard";
  }

  return destino;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.erro ?? "Não foi possível entrar.");
      }

      router.push(destinoSeguro());
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08), transparent 55%)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/30">
            <Store className="h-6 w-6 text-white" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            CODE_PH Gestão
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
              />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                spellCheck={false}
                placeholder="nome@empresa.com"
                className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="senha"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Senha
            </label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
              />
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha"
                className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((aberto) => !aberto)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:hover:text-zinc-300"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            aria-busy={carregando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Acesso restrito à equipe autorizada
        </p>
      </div>
    </main>
  );
}
