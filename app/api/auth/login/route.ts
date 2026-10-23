import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  COOKIE_SESSAO,
  DURACAO_SESSAO_SEGUNDOS,
  criarTokenSessao,
  segredoAuth,
} from "@/lib/auth/session";
import { ErroApi, lerCorpoJson, obterIp, respostaErro } from "@/lib/server/http";
import {
  consumirLimite,
  estaBloqueado,
  limparLimite,
  registrarBloqueio,
} from "@/lib/server/rate-limit";

const esquema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

// Mensagem genérica: nunca revela se o e-mail existe ou se a senha está errada.
const MENSAGEM_CREDENCIAIS = "E-mail ou senha inválidos.";
const MENSAGEM_BLOQUEIO =
  "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";

const JANELA_LOGIN_MS = 15 * 60 * 1000;

// Limite máximo de falhas por IP na janela antes de bloquear direto.
const MAX_FALHAS_IP = 20;

/**
 * Bloqueio progressivo por IP: quanto mais falhas, maior a espera.
 * Ex.: 5 falhas -> 1 min, 10 -> 5 min, 15 -> 15 min, 20 -> 1 h.
 */
function bloqueioProgressivoMs(falhas: number) {
  if (falhas <= 5) return 60 * 1000;
  if (falhas <= 10) return 5 * 60 * 1000;
  if (falhas <= 15) return 15 * 60 * 1000;
  return 60 * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    const ip = obterIp(request);
    const corpo = await lerCorpoJson<unknown>(request);
    const validado = esquema.safeParse(corpo);

    if (!validado.success) {
      throw new ErroApi(400, "Dados de login inválidos.", validado.error.flatten());
    }

    const email = validado.data.email.toLowerCase();

    // 1) Espera progressiva por IP: se o IP já estourou o limite de falhas,
    // fica de castigo antes mesmo de tentar autenticar.
    if (await estaBloqueado("login:espera", ip)) {
      throw new ErroApi(429, MENSAGEM_BLOQUEIO);
    }

    // 2) Limite por IP+email: trava ataques focados em uma única conta.
    const chaveConta = `${ip}:${email}`;
    const limiteConta = await consumirLimite({
      escopo: "login:conta",
      chave: chaveConta,
      maximo: 5,
      janelaMs: JANELA_LOGIN_MS,
      bloqueioMs: JANELA_LOGIN_MS,
    });

    // 3) Limite por IP: trava varredura de várias contas do mesmo IP.
    const limiteIp = await consumirLimite({
      escopo: "login:ip",
      chave: ip,
      maximo: 20,
      janelaMs: JANELA_LOGIN_MS,
      bloqueioMs: 30 * 60 * 1000,
    });

    if (!limiteConta.permitido || !limiteIp.permitido) {
      throw new ErroApi(429, MENSAGEM_BLOQUEIO);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        senhaHash: true,
      },
    });

    const senhaCorreta =
      usuario && usuario.ativo
        ? await compare(validado.data.senha, usuario.senhaHash)
        : false;

    if (!usuario || !usuario.ativo || !senhaCorreta) {
      // Conta as falhas do IP. O limite é alto de propósito: o contador serve
      // para escalar a espera progressiva.
      const falhas = await consumirLimite({
        escopo: "login:falhas",
        chave: ip,
        maximo: MAX_FALHAS_IP,
        janelaMs: JANELA_LOGIN_MS,
        bloqueioMs: 60 * 60 * 1000,
      });

      const totalFalhas = MAX_FALHAS_IP - falhas.restantes;

      if (!falhas.permitido || totalFalhas >= MAX_FALHAS_IP) {
        await registrarBloqueio(
          "login:espera",
          ip,
          bloqueioProgressivoMs(totalFalhas)
        );
        throw new ErroApi(429, MENSAGEM_BLOQUEIO);
      }

      if (totalFalhas >= 5) {
        await registrarBloqueio(
          "login:espera",
          ip,
          bloqueioProgressivoMs(totalFalhas)
        );
      }

      throw new ErroApi(401, MENSAGEM_CREDENCIAIS);
    }

    await Promise.all([
      limparLimite("login:conta", chaveConta),
      limparLimite("login:ip", ip),
      limparLimite("login:falhas", ip),
      limparLimite("login:espera", ip),
    ]);

    const token = await criarTokenSessao(
      { sub: usuario.id, papel: usuario.papel },
      segredoAuth()
    );

    const resposta = NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    });

    resposta.cookies.set(COOKIE_SESSAO, token, {
      httpOnly: true,
      // "strict" impede que o cookie acompanhe requisições vindas de outros
      // sites (proteção contra CSRF).
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DURACAO_SESSAO_SEGUNDOS,
    });

    return resposta;
  } catch (erro) {
    return respostaErro(erro);
  }
}
