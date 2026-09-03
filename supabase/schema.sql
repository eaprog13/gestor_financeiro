-- ════════════════════════════════════════════════════════════════════════
-- Gastos — Gestor Financeiro — Schema Supabase (Postgres + Auth)
-- Executar no SQL Editor do projeto Supabase, por esta ordem:
--   1) schema.sql
--   2) policies.sql
--   3) seed.sql       (categorias base — necessário para a app funcionar)
--   4) npm run seed   (utilizador inicial — usa a Admin API, não SQL puro)
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Perfis ─────────────────────────────────────────────────────────────
-- Estende auth.users (Supabase Auth trata de password/sessão/tokens; esta
-- tabela só guarda o que é próprio da app). Criado automaticamente via
-- trigger sempre que um utilizador é criado (ver handle_new_user, abaixo) —
-- sempre pela Admin API, nunca signup público: app fechada, os membros da
-- família são adicionados por quem já tem acesso (/settings/users).
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null unique,
  name           text not null,
  -- Cor de destaque da própria página (ver src/lib/theme.ts para as opções
  -- válidas) — preferência pessoal, não partilhada como o resto dos dados.
  theme          text not null default 'green',
  -- Claro/escuro/sistema (ver src/lib/colorScheme.ts) — por defeito segue o
  -- sistema operativo (prefers-color-scheme), só grava aqui quando alguém
  -- escolhe explicitamente ignorar isso.
  color_scheme   text not null default 'system' check (color_scheme in ('light', 'dark', 'system')),
  -- Vista por defeito de "Despesas por categoria" no dashboard: 'year' ou um
  -- mês concreto 'yyyy-MM' (ver src/lib/data.ts, CategoryViewPicker) — o
  -- formato do mês é validado em zod (src/lib/validation.ts), não aqui.
  category_view  text not null default 'year',
  created_at     timestamptz not null default now()
);

comment on table public.profiles is 'Dados complementares de cada membro da família com acesso à app.';

-- Idempotente: quem já tinha corrido este schema.sql antes destas colunas
-- existirem só precisa de voltar a correr o ficheiro — não recria a tabela.
alter table public.profiles add column if not exists theme text not null default 'green';
alter table public.profiles add column if not exists color_scheme text not null default 'system' check (color_scheme in ('light', 'dark', 'system'));
alter table public.profiles add column if not exists category_view text not null default 'year';

-- ── Categorias ──────────────────────────────────────────────────────────
-- "sort_order" (não "order", palavra reservada em SQL) define a posição no
-- registo rápido. As categorias base (is_default) não podem ser apagadas,
-- para a app nunca ficar sem opções — ver regra em core/services.
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  icon        text not null,                 -- nome do ícone (lucide-react) — ver src/lib/icons.ts
  color       text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_default  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.categories is 'Categorias de despesa (ex: Supermercado, Farmácia, Gasolina...).';

-- ── Despesas ────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(12, 2) not null check (amount > 0),
  note        text check (note is null or char_length(note) <= 200),
  -- Guardado como timestamptz ao meio-dia (ver app/actions.ts, createExpense)
  -- em vez de "date" puro: evita que a conversão de/para o fuso horário do
  -- browser empurre uma despesa para o dia anterior/seguinte perto da
  -- meia-noite — o mesmo problema que "date" sozinho teria, só que mais
  -- difícil de ver em testes rápidos.
  date        timestamptz not null default now(),
  category_id uuid not null references public.categories (id) on delete restrict,
  created_at  timestamptz not null default now()
);

comment on table public.expenses is 'Uma despesa individual, associada a uma categoria.';

create index if not exists expenses_date_idx on public.expenses (date);
create index if not exists expenses_category_idx on public.expenses (category_id);

-- ── Row Level Security ──────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;

-- ── Trigger: criar perfil automaticamente ao criar um utilizador ──────
-- O admin cria o utilizador via Supabase Admin API (auth.admin.createUser),
-- passando "name" em user_metadata (ver
-- src/adapters/supabase/identityAdminProvider.ts); este trigger copia
-- email/nome para public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
