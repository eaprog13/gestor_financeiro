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

App fechada, sem registo público: as contas criam-se no painel do Supabase
(ou com `npm run seed`, para a primeira) e só entram depois de marcadas como
membro da família — ver "Segurança". Em `/settings/users` vê-se e edita-se
quem já tem acesso.

## Requisitos

- Node.js 20.9 ou superior (exigido pelo Next.js 16).
- Um projeto [Supabase](https://supabase.com) (o plano grátis chega).
- Opcional, mas obrigatório em produção: uma base Redis no
  [Upstash](https://upstash.com) para o limite de tentativas de login.

## Arquitetura

Hexagonal (ports & adapters): o núcleo do negócio nunca depende do Supabase
diretamente, só de interfaces — trocar de base de dados no futuro significa
escrever novos adapters, sem tocar em services nem em rotas.

```
src/core/types.ts               tipos de domínio (Category, Expense, Profile)
src/core/ports/                  interfaces (contratos) de dados, identidade e autenticação
src/core/services/                regras de negócio — testadas com fakes em memória
src/adapters/supabase/            implementação dos ports sobre o Supabase (dados, Auth, cliente service_role)
src/adapters/upstash/             limite de tentativas partilhado (Redis)
src/adapters/memoria/             limite de tentativas em memória (reserva sem Upstash)
src/composition/container.ts      raiz de composição — único sítio que escolhe "Supabase"
src/lib/auth/session.ts           getSession()/requireSession() — sessão do pedido, só membros
src/lib/security/headers.ts       cabeçalhos de segurança (CSP, HSTS, ...) — ver "Segurança"
src/composition/autenticacao*.ts  escolhe o fornecedor de autenticação e o limitador de tentativas
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
4. **Authentication → Sign In / Providers** → desliga "Allow new users to
   sign up" (as contas criam-se só pelo painel ou pela Admin API).
5. **Authentication → URL Configuration** → em "Site URL" põe o endereço da
   app (ex: `http://localhost:3000` em desenvolvimento) e acrescenta
   `<endereço da app>/auth/callback` aos "Redirect URLs" — sem isto o link
   de "recuperar password" não funciona.
6. Cria o primeiro utilizador (já fica marcado como membro):
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
  não há API de dados exposta nesta app (só Server Actions e o
  `GET /auth/callback` do link de recuperação), por isso não há "CORS" a
  configurar; o comportamento por omissão (só o próprio domínio) já é o que
  se quer.
- **Só membros da família entram** (`ehMembro()` em
  `src/lib/security/sessionActivity.ts`): a conta tem de ter
  `app_metadata.membro = true`, que só a Admin API (chave service_role)
  consegue escrever. **A app não cria contas:** criam-se só no painel do
  Supabase (Authentication → Users → Add user, com "Auto Confirm User") e
  marcam-se com `supabase/membros.sql` no SQL Editor (ou
  `npm run membros -- marcar <email>`). O registo público tem de estar
  desligado no Supabase (Authentication → Sign In / Providers → "Allow new
  users to sign up"); mesmo que alguém o volte a ligar, uma conta criada
  assim nunca entra, porque não tem a marca.
- **Base de dados fechada às chaves públicas** (`supabase/policies.sql`):
  RLS ligado e nenhuma policy para `anon`/`authenticated` — a app só usa a
  chave service_role, no servidor; pela API REST do Supabase, com a chave
  anon (que é pública), não se lê nem escreve nada.
- **Rate limiting** (`LIMITES_TENTATIVAS` em `src/core/services/authService.ts`), no login, na
  confirmação da password atual e no pedido de recuperação: 10 tentativas/minuto por email+IP e 20/10
  min só por email (apanha ataques a partir de vários IPs). Com Upstash
  (`UPSTASH_REDIS_REST_URL`/`TOKEN` — obrigatório em produção) o limite é
  partilhado por todas as instâncias; sem ele fica em memória, por
  instância (nunca sem limite nenhum).
- **Sessão** (`src/proxy.ts` + `src/lib/security/sessionActivity.ts`):
  cookies HTTP-only geridos pelo Supabase Auth (o JWT nunca fica acessível
  a JavaScript) e um cookie de atividade assinado com HMAC. A sessão
  termina com **30 min sem atividade** ou ao fim de **12 h**, e também se
  esse cookie faltar ou for adulterado.
- **Password:** mínimo 10 caracteres com maiúscula, minúscula e número;
  mudá-la pede a password atual (só o link de recuperação, durante 15
  min, a dispensa) e termina as outras sessões abertas.

## Trocar de stack

A lógica não depende do fornecedor. O `src/core/` (tipos, regras de negócio
e **regras de segurança**) só conhece interfaces (`src/core/ports/`) — nunca
o Supabase, o Upstash nem o Next.js:

| Para trocar | Escrever | E mudar |
|---|---|---|
| Base de dados | um adapter por repositório de `core/ports/repositories.ts` | `src/composition/container.ts` |
| Autenticação | um `FornecedorAutenticacao` (`core/ports/auth.ts`) | `src/composition/autenticacao.ts` |
| Limite de tentativas | um `LimitadorTentativas` (`core/ports/auth.ts`) | `src/composition/autenticacaoPedido.ts` |
| Framework web | as páginas, as Server Actions, o proxy e os cookies | — o `core/` e os `adapters/` ficam |

As regras de segurança estão em `src/core/services/authService.ts` e são
testadas com fornecedores falsos (`authService.test.ts`), por isso valem
para qualquer implementação: limite de tentativas antes de experimentar a
password, só membros entram (uma conta sem a marca fecha logo a sessão e
responde como password errada), a password atual é obrigatória para a
mudar (exceto pelo link de recuperação) e as outras sessões terminam, e o
pedido de recuperação responde sempre igual. O timeout da sessão
(`src/lib/security/sessionActivity.ts`) e o reforço dos cookies
(HTTP-only/Secure, aplicado na composição) também não dependem do fornecedor.

O que um fornecedor novo tem de garantir por si:
- **membro** só pode ser escrito por um administrador (no Supabase:
  `app_metadata`, nunca `user_metadata`);
- a base de dados **não** fica acessível com credenciais públicas (no
  Supabase: `supabase/policies.sql`) e o registo público fica desligado;
- `utilizadorAtual()` valida a sessão no fornecedor, não só no cookie.

## A correr localmente

```bash
cp .env.example .env   # preenche com as credenciais do teu projeto Supabase
npm install
npm run seed             # cria o utilizador inicial (INITIAL_USER_* do .env), já como membro
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e entra com o
`INITIAL_USER_EMAIL` / `INITIAL_USER_PASSWORD` que definiste no `.env`
(usa uma password forte — as regras de "Segurança" só são verificadas
quando a mudas dentro da app).

Para dar acesso a mais pessoas: cria a conta no painel do Supabase
(Authentication → Users → Add user, com "Auto Confirm User") e depois

```bash
npm run membros                          # lista as contas e quem é membro
npm run membros -- marcar <email>        # dá acesso
npm run membros -- desmarcar <email>     # tira o acesso
```

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
  não apagável, email duplicado não chega a chamar a Admin API, regras de
  segurança do login), usando implementações em memória dos ports
  (`src/core/services/testFakes.ts`) em vez do Supabase real.
- `src/lib/security/sessionActivity.test.ts` — timeout da sessão e cookie de
  atividade assinado.
- `src/adapters/**/*.test.ts` — adapter de autenticação do Supabase e
  limitador de tentativas em memória.

## Deploy

Pensada para viver num subdomínio próprio (ex: `financas.oteudominio.com`):

- **Vercel (recomendado).** Liga o repositório, adiciona o subdomínio ao
  projeto (Settings → Domains) e aponta um CNAME no DNS do teu domínio —
  o Vercel emite o certificado TLS automaticamente. Define as variáveis de
  ambiente do `.env.example` no projeto (incluindo as do Upstash); o deploy
  é automático a cada push. Atualiza também o "Site URL" e os "Redirect
  URLs" do Supabase para o endereço de produção.
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
