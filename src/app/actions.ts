"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterContentor } from "@/composition/container";
import { atualizarCategoria, criarCategoria, reordenarCategorias, removerCategoria } from "@/core/services/categoryService";
import { criarDespesa, removerDespesa } from "@/core/services/expenseService";
import { requireSession, destroySession } from "@/lib/auth/session";
import { categorySchema, expenseSchema } from "@/lib/validation";
import { formatCurrency } from "@/lib/format";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/categorias");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export type ExpenseFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireSession();
  const parsed = expenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { categoryId, amount, date, note } = parsed.data;
  const resultado = await criarDespesa(obterContentor(), {
    categoryId,
    amount,
    note,
    date: new Date(`${date}T12:00:00`),
  });

  if (!resultado.ok) {
    return { status: "error", message: resultado.message };
  }

  revalidateAll();

  return {
    status: "success",
    message: `Guardado: ${formatCurrency(amount)} em ${resultado.categoryName}`,
  };
}

export async function deleteExpense(id: string) {
  await requireSession();
  await removerDespesa(obterContentor(), id);
  revalidateAll();
}

export type CategoryFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireSession();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const resultado = await criarCategoria(obterContentor(), parsed.data);
  if (!resultado.ok) {
    return { status: "error", message: resultado.message };
  }

  revalidateAll();

  return { status: "success", message: `Categoria "${resultado.category.name}" criada.` };
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireSession();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const resultado = await atualizarCategoria(obterContentor(), id, parsed.data);
  if (!resultado.ok) {
    return { status: "error", message: resultado.message };
  }

  revalidateAll();

  return { status: "success", message: `Categoria "${resultado.category.name}" atualizada.` };
}

export async function reorderCategories(ids: string[]): Promise<{ ok: boolean; message?: string }> {
  await requireSession();
  const resultado = await reordenarCategorias(obterContentor(), ids);
  if (!resultado.ok) {
    return { ok: false, message: resultado.message };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireSession();
  const resultado = await removerCategoria(obterContentor(), id);
  if (!resultado.ok) {
    return { ok: false, message: resultado.message };
  }

  revalidateAll();
  return { ok: true };
}
