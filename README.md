# Gastos — Gestor Financeiro

Aplicação de gestão de despesas do dia a dia: registo rápido por categoria
(Supermercado, Farmácia, Gasolina, Eletricidade, Gás, ...), histórico
filtrável e métricas (diário/semanal/mensal/anual, comparação ano a ano).
Pensada para a família aceder de qualquer lado (telemóvel/PC) através de um
link — ver "Deploy".

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router, TypeScript, Server Actions) — front-end e back-end na mesma app.
- **[Tailwind CSS 4](https://tailwindcss.com)** — UI.
- **[Supabase](https://supabase.com)** — Postgres gerido + Auth, acedidos via `@supabase/supabase-js` / `@supabase/ssr` (sem ORM — ver "Base de dados e autenticação" abaixo).
- **[lucide-react](https://lucide.dev)** — ícones das categorias.
- **[zod](https://zod.dev)** — validação dos formulários.
- **[Vitest](https://vitest.dev)** — testes da lógica de negócio.

App fechada, sem registo público: os membros da família são adicionados por
quem já tem acesso (`/settings/users`), via Admin API do Supabase Auth.

## Arquitetura

Hexagonal (ports & adapters): o núcleo do negócio nunca depende do Supabase
diretamente, só de interfaces — trocar de base de dados no futuro significa
escrever novos adapters, sem tocar em services nem em rotas.

```
src/core/types.ts               tipos de domínio (Category, Expense, Profile)
src/core/ports/                  interfaces (contratos) de dados e identidade
src/core/services/                regras de negócio — testadas com fakes em memória
src/adapters/supabase/            implementação dos ports sobre o Supabase
src/composition/container.ts      raiz de composição — único sítio que escolhe "Supabase"
src/lib/supabase/admin.ts         cliente Supabase (chave service_role) — todo o acesso a dados
src/lib/supabase/server.ts        cliente Supabase (chave anon, sessão do pedido) — só autenticação
src/lib/auth/session.ts           getSession()/requireSession() a partir da sessão Supabase Auth
src/lib/security/headers.ts       cabeçalhos de segurança (CSP, HSTS, ...) — ver "Segurança"
src/lib/security/rateLimit.ts     limite de tentativas de login
src/proxy.ts                      renova a sessão, protege rotas e aplica os cabeçalhos de segurança
src/lib/metrics.ts                cálculo puro das métricas (computeMetrics, testável sem BD)
src/app/(app)/                    páginas autenticadas (dashboard, histórico, categorias, métricas, utilizadores)
src/app/login/                    página e Server Action de login
supabase/                         schema.sql, policies.sql, seed.sql/seed.ts, relatorio_saude_bd.sql
```

**Nota sobre `src/proxy.ts`:** no Next.js 16 a convenção `middleware.ts` foi
renomeada para `proxy.ts` (mesmo comportamento, só o nome do ficheiro/export
mudou).

## Base de dados e autenticação (Supabase)

Sem ORM/migrations — schema em SQL puro, aplicado manualmente no SQL Editor
do Supabase:

1. Cria um projeto em [supabase.com](https://supabase.com) (grátis).
2. **SQL Editor** → corre, por esta ordem:
   - `supabase/schema.sql` — tabelas (`profiles`, `categories`, `expenses`),
     índices, RLS, trigger que cria o perfil ao criar um utilizador.
   - `supabase/policies.sql` — RLS: dados partilhados por toda a família
     (qualquer autenticado lê/escreve tudo).
   - `supabase/seed.sql` — categorias base (idempotente).
3. **Project Settings → API** → copia `URL`, `anon public key` e
   `service_role key` para `.env` (ver `.env.example`).
4. Cria o primeiro utilizador:
   ```bash
   npm run seed   # lê INITIAL_USER_EMAIL/PASSWORD/NAME do .env
   ```

**Porquê sem ORM:** o schema real do Postgres (constraints, índices, RLS)
fica como fonte da verdade, sem uma camada de tradução/migrations no meio.
O acesso é feito através de repositórios em `src/adapters/supabase/`, que
isolam o resto da app do SQL.

**Validar/otimizar depois de estar em produção:** `supabase/relatorio_saude_bd.sql`
tem queries prontas (queries lentas, índices em falta, tabelas sem RLS,
bloat/autovacuum) — corre no SQL Editor ou como Custom Report no dashboard
do Supabase. Vale a pena correr também o **Security Advisor** e o
**Performance Advisor** do dashboard (Database → Advisors) depois do
primeiro deploy.

## Segurança

- **Cabeçalhos HTTP** (`src/lib/security/headers.ts`, aplicados em
  `src/proxy.ts`): Content-Security-Policy com nonce por pedido,
  Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy — o equivalente ao "helmet" do
  Express, adaptado ao runtime serverless/edge do Next.js.
- **CSRF em Server Actions:** o Next.js já compara a origem de cada pedido
  a uma Server Action com o domínio do host, e rejeita se não coincidir —
  não há rotas de API expostas nesta app (só Server Actions), por isso não
  há "CORS" a configurar; o comportamento por omissão (só o próprio
  domínio) já é o que se quer.
- **Rate limiting do login** (`src/lib/security/rateLimit.ts`): 10
  tentativas/minuto por email+IP, via Upstash Redis. Sem
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` definidos (ex.: dev
  local) fica inativo — configura-os em produção (ver `.env.example`).
- **Sessão:** cookies HTTP-only geridos pelo Supabase Auth — o JWT nunca
  fica acessível a JavaScript no browser.

## A correr localmente

```bash
cp .env.example .env   # preenche com as credenciais do teu projeto Supabase
npm install
npm run seed             # cria o utilizador inicial
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm test
```

Cobrem a lógica de negócio pura, sem precisar de ligação à base de dados:

- `src/lib/validation.test.ts` — regras dos formulários (zod).
- `src/lib/metrics.test.ts` — cálculo das métricas (`computeMetrics`), com despesas/categorias fixas.
- `src/lib/data.test.ts` — agrupamento do histórico por dia.
- `src/core/services/*.test.ts` — regras de negócio dos services (nome de
  categoria duplicado, categoria base não apagável, categoria com despesas
  não apagável, email duplicado não chega a chamar a Admin API), usando
  implementações em memória dos ports (`src/core/services/testFakes.ts`) em
  vez do Supabase real.

## Deploy

Pensada para viver num subdomínio próprio (ex: `financas.oteudominio.com`):

- **Vercel (recomendado).** Liga o repositório, adiciona o subdomínio ao
  projeto (Settings → Domains) e aponta um CNAME no DNS do teu domínio —
  o Vercel emite o certificado TLS automaticamente. Define as variáveis de
  ambiente do Supabase (ver `.env.example`) no projeto; o deploy é
  automático a cada push.
- **Subdomínio próprio (VPS / servidor de casa).** `npm run build` + `npm run start`
  (porta configurável via `PORT`) atrás de um reverse proxy (ex: Caddy ou
  nginx) com HTTPS.

**Nota:** projetos Supabase no plano free pausam automaticamente ao fim de
~7 dias sem pedidos. Para uma app de uso esporádico, considera um Vercel
Cron Job semanal que faça um pedido leve à app só para a manter acordada.

## Notas

- As categorias base (`is_default`) não podem ser apagadas, para a app nunca
  ficar sem opções no registo rápido; podes sempre acrescentar as tuas.
- Uma categoria só é apagável se não tiver despesas associadas.
