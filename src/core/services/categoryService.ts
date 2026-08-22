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
