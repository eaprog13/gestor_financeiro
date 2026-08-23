import { z } from "zod";
import { ICON_MAP } from "@/lib/icons";
import { THEME_OPTIONS } from "@/lib/theme";

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

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Indica o email.").email("Email inválido."),
  password: z.string().min(1, "Indica a password."),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "Nome demasiado curto.").max(80),
  email: z.string().trim().min(1, "Indica o email.").email("Email inválido."),
  password: z.string().min(8, "A password tem de ter pelo menos 8 caracteres."),
});

export const updateUserSchema = z.object({
  name: userSchema.shape.name,
});

export const themeSchema = z.object({
  theme: z.enum(THEME_OPTIONS.map((t) => t.id) as [string, ...string[]], { error: "Tema inválido." }),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "A password tem de ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As passwords não coincidem.",
    path: ["confirmPassword"],
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
