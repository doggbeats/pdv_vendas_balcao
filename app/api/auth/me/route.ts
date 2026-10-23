import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/lib/auth/servidor";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  return NextResponse.json({ usuario });
}
