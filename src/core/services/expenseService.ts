import type { Dependencias } from "@/core/deps";
import type { Expense } from "@/core/types";

export type ResultadoCriarDespesa =
  | { ok: true; expense: Expense; categoryName: string }
  | { ok: false; message: string };

export async function criarDespesa(
  dependencias: Dependencias,
  dados: { categoryId: string; amount: number; date: Date; note?: string }
): Promise<ResultadoCriarDespesa> {
  const category = await dependencias.categorias.obterPorId(dados.categoryId);
  if (!category) {
    return { ok: false, message: "Categoria não encontrada." };
  }

  const expense = await dependencias.despesas.criar(dados);
  return { ok: true, expense, categoryName: category.name };
}

export async function removerDespesa(dependencias: Dependencias, id: string): Promise<void> {
  await dependencias.despesas.remover(id);
}
