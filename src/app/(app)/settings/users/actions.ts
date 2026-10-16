"use server";

import { revalidatePath } from "next/cache";
import { obterContentor } from "@/composition/container";
import { atualizarUtilizador } from "@/core/services/userService";
import { requireSession } from "@/lib/auth/session";
import { idSchema, updateUserSchema } from "@/lib/validation";

export type ActionState = { status: "idle" | "error" | "success"; message?: string };

export async function updateUser(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  if (!idSchema.safeParse(id).success) {
    return { status: "error", message: "Utilizador inválido." };
  }

  const parsed = updateUserSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await atualizarUtilizador(obterContentor(), id, parsed.data);

  revalidatePath("/settings/users");
  return { status: "success", message: "Nome atualizado." };
}
