import { z } from "zod";
import { ICON_MAP } from "@/lib/icons";

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Escolhe uma categoria."),
  amount: z.coerce
    .number({ error: "Indica um valor válido." })
    .positive("O valor tem de ser maior que zero.")
    .max(1_000_000, "Valor demasiado alto."),
  date: z.string().min(1, "Indica uma data."),
  note: z
    .string()
    .max(200, "Máximo de 200 caracteres.")
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome demasiado curto.")
    .max(40, "Nome demasiado longo."),
  icon: z
    .string()
    .refine((v) => v in ICON_MAP, { error: "Ícone inválido." }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
});
