import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  segredoAuth,
  verificarTokenSessao,
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const sessao = token ? await verificarTokenSessao(token, segredoAuth()) : null;

  if (pathname === "/login") {
    if (sessao) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!sessao) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
