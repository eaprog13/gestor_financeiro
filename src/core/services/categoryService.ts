import type { Dependencias } from "@/core/deps";
import type { Category } from "@/core/types";

export type ResultadoCriarCategoria =
  | { ok: true; category: Category }
  | { ok: false; message: string };

export async function criarCategoria(
  dependencias: Dependencias,
  dados: { name: string; icon: string; color: string }
): Promise<ResultadoCriarCategoria> {
  const existing = await dependencias.categorias.obterPorNome(dados.name);
  if (existing) {
    return { ok: false, message: "Já existe uma categoria com esse nome." };
  }

  const order = await dependencias.categorias.contar();
  const category = await dependencias.categorias.criar({ ...dados, order });
  return { ok: true, category };
}

export type ResultadoAtualizarCategoria =
  | { ok: true; category: Category }
  | { ok: false; message: string };

export async function atualizarCategoria(
  dependencias: Dependencias,
  id: string,
  dados: { name: string; icon: string; color: string }
): Promise<ResultadoAtualizarCategoria> {
  const category = await dependencias.categorias.obterPorId(id);
  if (!category) {
    return { ok: false, message: "Categoria não encontrada." };
  }

  // Só rejeita por nome duplicado se o nome mudou para o de OUTRA categoria
  // — sem este cuidado, guardar sem alterar o nome (só cor/ícone) rejeitava
  // sempre, por a categoria "colidir" consigo própria.
  const existing = await dependencias.categorias.obterPorNome(dados.name);
  if (existing && existing.id !== id) {
    return { ok: false, message: "Já existe uma categoria com esse nome." };
  }

  const updated = await dependencias.categorias.atualizar(id, dados);
  return { ok: true, category: updated };
}

export type ResultadoReordenarCategorias = { ok: true } | { ok: false; message: string };

export async function reordenarCategorias(
  dependencias: Dependencias,
  ids: string[]
): Promise<ResultadoReordenarCategorias> {
  const existentes = await dependencias.categorias.listar();

  // "ids" tem de ser exatamente o conjunto de categorias existentes (só a
  // ordem pode mudar) — protege contra um pedido malformado que apagasse
  // categorias da ordenação por engano (ex.: um id repetido, ou a lista
  // dessincronizada do que está no ecrã de quem está a arrastar).
  const idsExistentes = new Set(existentes.map((c) => c.id));
  const mesmoConjunto = ids.length === existentes.length && ids.every((id) => idsExistentes.has(id));
  if (!mesmoConjunto) {
    return { ok: false, message: "Lista de categorias desatualizada — recarrega a página e tenta de novo." };
  }

  await dependencias.categorias.reordenar(ids);
  return { ok: true };
}

export type ResultadoRemoverCategoria = { ok: true } | { ok: false; message: string };

export async function removerCategoria(
  dependencias: Dependencias,
  id: string
): Promise<ResultadoRemoverCategoria> {
  const category = await dependencias.categorias.obterPorId(id);
  if (!category) {
    return { ok: false, message: "Categoria não encontrada." };
  }
  if (category.isDefault) {
    return { ok: false, message: "As categorias base não podem ser apagadas." };
  }

  const expenseCount = await dependencias.despesas.contarPorCategoria(id);
  if (expenseCount > 0) {
    return {
      ok: false,
      message:
        "Esta categoria tem despesas associadas. Apaga-as primeiro para poderes remover a categoria.",
    };
  }

  await dependencias.categorias.remover(id);
  return { ok: true };
}
