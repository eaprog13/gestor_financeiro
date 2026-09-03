"use server";

import { revalidatePath } from "next/cache";
import { obterContentor } from "@/composition/container";
import { atualizarColorScheme, atualizarTema } from "@/core/services/userService";
import { requireSession } from "@/lib/auth/session";
import { colorSchemeSchema, themeSchema } from "@/lib/validation";

export type ActionState = { status: "idle" | "error" | "success"; message?: string };

/**
 * Sempre a própria sessão — nunca recebe um "id" de fora, ao contrário de
 * updateUser em settings/users/actions.ts (essa gere outras contas; esta é
 * só a preferência pessoal de quem está autenticado).
 */
export async function updateTheme(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = themeSchema.safeParse({ theme: formData.get("theme") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await atualizarTema(obterContentor(), session.sub, parsed.data.theme);

  // "/" abrange todo o grupo (app) por herdar o layout — mas listar as
  // páginas específicas é mais explícito sobre o que realmente depende do
  // tema (todas, por causa do Nav) e consistente com revalidateAll() em
  // src/app/actions.ts.
  revalidatePath("/", "layout");

  return { status: "success", message: "Aparência atualizada." };
}

/** Claro/escuro/sistema — mesma forma que updateTheme, ver ColorSchemePicker. */
export async function updateColorScheme(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = colorSchemeSchema.safeParse({ colorScheme: formData.get("colorScheme") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await atualizarColorScheme(obterContentor(), session.sub, parsed.data.colorScheme);
  revalidatePath("/", "layout");

  return { status: "success", message: "Aparência atualizada." };
}
