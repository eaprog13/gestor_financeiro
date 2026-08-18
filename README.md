# Gastos — Gestor Financeiro

Aplicação de gestão de despesas do dia a dia: registo rápido por categoria
(Supermercado, Farmácia, Gasolina, Eletricidade, Gás, ...), histórico
filtrável e um resumo mensal por categoria.

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router, TypeScript, Server Actions) — front-end e back-end na mesma app.
- **[Tailwind CSS 4](https://tailwindcss.com)** — UI.
- **[Prisma 7](https://www.prisma.io)** — ORM.
- **SQLite** em desenvolvimento (ficheiro local, zero configuração) — troca fácil para **Postgres** em produção, ver abaixo.
- **[lucide-react](https://lucide.dev)** — ícones das categorias.
- **[zod](https://zod.dev)** — validação dos formulários.

Não há autenticação: é pensada para uso pessoal/familiar numa instância só
tua. Se a fores expor publicamente na Internet (ver "Deploy"), considera
colocá-la atrás de uma password (ex: Basic Auth na Vercel, ou autenticação
do proxy que uses).

## A correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

A base de dados (`prisma/dev.db`) já vem criada e semeada com as categorias
base (`npx prisma db seed`, já executado). Se apagares o ficheiro:

```bash
npx prisma migrate dev
npx prisma db seed
```

## Estrutura

```
prisma/schema.prisma      modelos Category / Expense
src/app/actions.ts         Server Actions (criar/apagar despesas e categorias)
src/lib/data.ts             leituras à base de dados para as páginas
src/app/page.tsx            Dashboard (registo rápido + resumo do mês)
src/app/historico/          histórico com filtros por mês/categoria/nota
src/app/categorias/         gestão de categorias
```

## Passar para Postgres

O SQLite serve bem para uso local, mas não sobrevive a deploys "serverless"
sem disco persistente (ex: Vercel). Para produção, troca para Postgres —
o [Neon](https://neon.tech) e o [Supabase](https://supabase.com) têm planos
gratuitos que chegam perfeitamente para esta app.

1. Cria uma base de dados Postgres e copia o `DATABASE_URL`.
2. Em `prisma/schema.prisma`, muda o datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
3. Troca o adapter em `src/lib/prisma.ts` (e `prisma/seed.ts`) de
   `@prisma/adapter-libsql` para `@prisma/adapter-pg`:
   ```bash
   npm install @prisma/adapter-pg pg
   npm uninstall @prisma/adapter-libsql @libsql/client
   ```
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
   ```
4. Define `DATABASE_URL` com a connection string do Postgres (no `.env` local
   e nas variáveis de ambiente da plataforma de deploy).
5. `npx prisma migrate deploy` para aplicar as migrações existentes, depois
   `npx prisma db seed` para criar as categorias base.

## Deploy

Duas opções razoáveis, conforme decidires:

- **Vercel (mais simples).** Liga o repositório, define `DATABASE_URL`
  (Postgres — ver acima) nas variáveis de ambiente do projeto, e o deploy
  é automático a cada push. Tem plano gratuito.
- **Subdomínio próprio (VPS / servidor de casa).** Faz `npm run build` +
  `npm run start` (porta configurável via `PORT`) atrás de um reverse proxy
  (ex: Caddy ou nginx) com HTTPS. Podes manter SQLite aqui se o processo
  correr sempre na mesma máquina com disco persistente — não precisas de
  Postgres neste cenário, a menos que queiras acesso concorrente de vários
  serviços à mesma base de dados.

## Notas

- As categorias base (`isDefault`) não podem ser apagadas, para a app nunca
  ficar sem opções no registo rápido; podes sempre acrescentar as tuas.
- Uma categoria só é apagável se não tiver despesas associadas.
