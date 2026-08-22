import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import type { Dependencias } from "@/core/deps";
import { RepositorioCategoriaSupabase } from "@/adapters/supabase/categoryRepository";
import { RepositorioDespesaSupabase } from "@/adapters/supabase/expenseRepository";
import { RepositorioPerfilSupabase } from "@/adapters/supabase/profileRepository";
import { FornecedorGestaoIdentidadeSupabase } from "@/adapters/supabase/identityAdminProvider";

/**
 * Raiz de composição: único ficheiro que escolhe qual implementação
 * concreta (Supabase hoje) satisfaz cada contrato de src/core/ports. Para
 * trocar de base de dados/fornecedor de identidade, criar novos adapters
 * em src/adapters/<novo/> e substituir as linhas abaixo — core/services e
 * as rotas não mudam.
 */

let dependenciasEmCache: Dependencias | null = null;

export function obterContentor(): Dependencias {
  if (dependenciasEmCache) return dependenciasEmCache;

  const bd = criarClienteAdmin();

  dependenciasEmCache = {
    categorias: new RepositorioCategoriaSupabase(bd),
    despesas: new RepositorioDespesaSupabase(bd),
    perfis: new RepositorioPerfilSupabase(bd),
    identidade: new FornecedorGestaoIdentidadeSupabase(bd.auth.admin),
  };

  return dependenciasEmCache;
}
