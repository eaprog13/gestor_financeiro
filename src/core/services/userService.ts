import type { Dependencias } from "@/core/deps";

export async function atualizarTema(dependencias: Dependencias, id: string, theme: string) {
  return dependencias.perfis.atualizarTema(id, theme);
}

export async function atualizarColorScheme(dependencias: Dependencias, id: string, colorScheme: string) {
  return dependencias.perfis.atualizarColorScheme(id, colorScheme);
}

export async function atualizarCategoryView(dependencias: Dependencias, id: string, categoryView: string) {
  return dependencias.perfis.atualizarCategoryView(id, categoryView);
}

export async function atualizarUtilizador(dependencias: Dependencias, id: string, dados: { name: string }) {
  // Duas escritas — public.profiles (mostrado em /settings/users) e
  // user_metadata (fonte do nome na sessão, ver core/ports/identity.ts) —
  // sem transação porque são dois sistemas diferentes (BD vs. Auth); em
  // caso de falha a meio, a próxima edição volta a sincronizar os dois.
  const perfil = await dependencias.perfis.atualizar(id, dados);
  await dependencias.identidade.atualizarNome(id, dados.name);
  return perfil;
}
