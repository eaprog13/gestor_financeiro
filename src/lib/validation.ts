import { z } from "zod";
import { ICON_MAP } from "@/lib/icons";
import { THEME_OPTIONS } from "@/lib/theme";
import { COLOR_SCHEME_OPTIONS } from "@/lib/colorScheme";

export const expenseSchema = z.object({
  categoryId: z.uuid({ error: "Escolhe uma categoria." }),
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

// Política de password igual à do gestor_investimento (era só min(8), sem
// exigir variedade de caracteres): esta app guarda as finanças da família.
export const passwordSchema = z
  .string()
  .min(10, "A password tem de ter pelo menos 10 caracteres.")
  .max(128)
  .regex(/[A-Z]/, "Deve incluir pelo menos uma letra maiúscula.")
  .regex(/[a-z]/, "Deve incluir pelo menos uma letra minúscula.")
  .regex(/[0-9]/, "Deve incluir pelo menos um número.");

/** Ids que vêm do browser (Server Actions): só UUIDs chegam à base de dados. */
export const idSchema = z.uuid({ error: "Identificador inválido." });

export const userSchema = z.object({
  name: z.string().trim().min(2, "Nome demasiado curto.").max(80),
  email: z.string().trim().min(1, "Indica o email.").email("Email inválido."),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: userSchema.shape.name,
});

export const themeSchema = z.object({
  theme: z.enum(THEME_OPTIONS.map((t) => t.id) as [string, ...string[]], { error: "Tema inválido." }),
});

export const colorSchemeSchema = z.object({
  colorScheme: z.enum(COLOR_SCHEME_OPTIONS.map((o) => o.id) as [string, ...string[]], {
    error: "Aparência inválida.",
  }),
});

/** "year" ou "yyyy-MM" — ver CategoryViewPicker/getDashboardData. */
export const categoryViewSchema = z.object({
  view: z
    .string()
    .refine((v) => v === "year" || /^\d{4}-\d{2}$/.test(v), { error: "Vista inválida." }),
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
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
