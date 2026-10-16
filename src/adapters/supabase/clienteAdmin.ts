import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave "service_role" — contorna Row Level
 * Security. Única forma de acesso à base de dados nesta app: não há
 * autenticação nem cliente de browser (ver README.md) — tudo passa por
 * Server Actions, sempre com este cliente (ver src/composition/container.ts).
 *
 * O import "server-only" faz falhar o build caso este ficheiro seja
 * importado, ainda que indiretamente, a partir de código de browser.
 */
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chaveServico) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL em falta nas variáveis de ambiente."
    );
  }

  return createClient(url, chaveServico, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
