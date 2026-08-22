"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para uso no browser (Client Components) — disponível para uso futuro; o login atual passa pelo cliente de servidor (ver src/app/login/actions.ts). */
export function criarClienteSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
