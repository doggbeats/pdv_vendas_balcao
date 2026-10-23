This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## CODE_PH Gestão

Sistema web profissional para mercadinhos e lojas de variedades (PDV, vendas, estoque, caixa e relatórios).

## Tecnologias (Etapa 1 - Fundação)
- Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- Tailwind CSS 4
- Prisma ORM + PostgreSQL
- Zod, NextAuth v5, bcryptjs
- Recharts, Lucide React
- Vitest, Playwright

## Pré-requisitos
- Node.js 18+ (recomendado 20+)
- PostgreSQL 14+

## Instalação

```bash
npm install
```

Copie `.env.example` para `.env.local` e configure:
```bash
cp .env.example .env.local
```
Edite `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`.

## Banco de dados

```bash
npx prisma generate
npx prisma migrate dev
# ou
npm run db:push
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm run test        # unitários/integrados (Vitest)
npm run test:e2e    # fluxos críticos (Playwright)
```

## Deploy em produção

- URL: <https://pdv-vendas-balcao.vercel.app>
- Projeto na Vercel: `pdv-vendas-balcao`, ligado ao repositório `doggbeats/pdv_vendas_balcao` (branch `main`)
- Banco: Neon (Postgres) provisionado pelo Marketplace da Vercel, região `gru1`

Variáveis de ambiente necessárias na Vercel:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | conexão com o Postgres (injetada pela integração Neon) |
| `AUTH_SECRET` | assinatura do cookie de sessão (obrigatória) |

O `postinstall` roda `prisma generate`, então `DATABASE_URL` precisa existir também durante o build.

### Primeiro provisionamento do banco

```bash
# use a URL sem pooler do banco de produção
npx prisma db push
node prisma/seed.mjs
```

O seed cria o administrador, o operador e os produtos iniciais a partir das variáveis `ADMIN_*` e `OPERADOR_*` (lidas do `.env`).

> `prisma db push` remove tabelas que não estão no schema. Nunca rode esse comando em um banco compartilhado com outro sistema.

### Onde os dados ficam

As telas de vendas, estoque, caixa e relatórios usam `localStorage`: os dados de negócio ficam no navegador de cada dispositivo. O Postgres guarda apenas usuários e o controle de tentativas de login.
