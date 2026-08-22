-- ════════════════════════════════════════════════════════════════════════
-- Row Level Security — segunda linha de defesa a nível da base de dados,
-- independente da validação já feita nas Server Actions (defense in depth).
--
-- Modelo de autorização desta app: despesas PARTILHADAS por toda a
-- família — qualquer membro autenticado lê e escreve tudo. A fronteira que
-- importa é "autenticado ou não", não "de quem é este registo".
-- ════════════════════════════════════════════════════════════════════════

-- ── profiles ────────────────────────────────────────────────────────────
create policy "profiles: utilizador vê o próprio perfil"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles: utilizador atualiza o próprio perfil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Criação de novos membros é feita exclusivamente pela Admin API (chave
-- service_role, que ignora RLS — ver src/app/(app)/settings/users/actions.ts)
-- de propósito: não há policy de insert para "authenticated" aqui.

-- ── categories / expenses ───────────────────────────────────────────────
create policy "categories: membros autenticados têm acesso total"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

create policy "expenses: membros autenticados têm acesso total"
  on public.expenses for all
  to authenticated
  using (true)
  with check (true);
