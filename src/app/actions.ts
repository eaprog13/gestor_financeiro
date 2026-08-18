"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema, expenseSchema } from "@/lib/validation";
import { formatCurrency } from "@/lib/format";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/categorias");
}

export type ExpenseFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
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

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });
  if (!category) {
    return { status: "error", message: "Categoria não encontrada." };
  }

  await prisma.expense.create({
    data: {
      categoryId,
      amount,
      note,
      date: new Date(`${date}T12:00:00`),
    },
  });

  revalidateAll();

  return {
    status: "success",
    message: `Guardado: ${formatCurrency(amount)} em ${category.name}`,
  };
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
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

  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return { status: "error", message: "Já existe uma categoria com esse nome." };
  }

  const count = await prisma.category.count();
  await prisma.category.create({
    data: { ...parsed.data, order: count },
  });

  revalidateAll();

  return { status: "success", message: `Categoria "${parsed.data.name}" criada.` };
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { expenses: true } } },
  });

  if (!category) {
    return { ok: false, message: "Categoria não encontrada." };
  }
  if (category.isDefault) {
    return { ok: false, message: "As categorias base não podem ser apagadas." };
  }
  if (category._count.expenses > 0) {
    return {
      ok: false,
      message:
        "Esta categoria tem despesas associadas. Apaga-as primeiro para poderes remover a categoria.",
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidateAll();

  return { ok: true };
}
