import { prisma } from "@/lib/db";

type OpcoesLimite = {
  escopo: string;
  chave: string;
  maximo: number;
  janelaMs: number;
  bloqueioMs: number;
};

export type ResultadoLimite = {
  permitido: boolean;
  restantes: number;
  bloqueadoAte?: Date;
};

export async function consumirLimite({
  escopo,
  chave,
  maximo,
  janelaMs,
  bloqueioMs,
}: OpcoesLimite): Promise<ResultadoLimite> {
  const agora = new Date();

  return prisma.$transaction(async (tx) => {
    const registro = await tx.limiteRequisicao.findUnique({
      where: { escopo_chave: { escopo, chave } },
    });

    if (!registro) {
      await tx.limiteRequisicao.create({
        data: { escopo, chave, contagem: 1, janelaInicio: agora },
      });
      return { permitido: true, restantes: maximo - 1 };
    }

    if (registro.bloqueadoAte && registro.bloqueadoAte > agora) {
      return {
        permitido: false,
        restantes: 0,
        bloqueadoAte: registro.bloqueadoAte,
      };
    }

    const janelaExpirou =
      agora.getTime() - registro.janelaInicio.getTime() > janelaMs;

    if (janelaExpirou || registro.bloqueadoAte) {
      await tx.limiteRequisicao.update({
        where: { id: registro.id },
        data: {
          contagem: 1,
          janelaInicio: agora,
          bloqueadoAte: null,
        },
      });
      return { permitido: true, restantes: maximo - 1 };
    }

    const contagem = registro.contagem + 1;

    if (contagem > maximo) {
      const bloqueadoAte = new Date(agora.getTime() + bloqueioMs);
      await tx.limiteRequisicao.update({
        where: { id: registro.id },
        data: { contagem, bloqueadoAte },
      });
      return { permitido: false, restantes: 0, bloqueadoAte };
    }

    await tx.limiteRequisicao.update({
      where: { id: registro.id },
      data: { contagem },
    });

    return { permitido: true, restantes: maximo - contagem };
  });
}

export async function limparLimite(escopo: string, chave: string) {
  await prisma.limiteRequisicao.deleteMany({ where: { escopo, chave } });
}

/** Verifica se a chave está bloqueada, sem incrementar a contagem. */
export async function estaBloqueado(escopo: string, chave: string) {
  const registro = await prisma.limiteRequisicao.findUnique({
    where: { escopo_chave: { escopo, chave } },
    select: { bloqueadoAte: true },
  });

  return Boolean(registro?.bloqueadoAte && registro.bloqueadoAte > new Date());
}

/** Aplica um bloqueio a partir de agora, sem contar tentativa. */
export async function registrarBloqueio(
  escopo: string,
  chave: string,
  bloqueioMs: number
) {
  const agora = new Date();
  const bloqueadoAte = new Date(agora.getTime() + bloqueioMs);

  await prisma.limiteRequisicao.upsert({
    where: { escopo_chave: { escopo, chave } },
    create: {
      escopo,
      chave,
      contagem: 1,
      janelaInicio: agora,
      bloqueadoAte,
    },
    update: { bloqueadoAte, contagem: 1, janelaInicio: agora },
  });
}
