// Paleta fechada de temas — o utilizador escolhe uma cor de destaque para a
// própria página (ver /preferencias) de entre estas opções, nunca um hex
// livre. Cada uma já vem com o par claro/escuro certo (contraste e
// saturação pensados para --accent-foreground branco em ambos), a mesma
// lógica do --accent por defeito em globals.css.
export type ThemeId = "green" | "blue" | "purple" | "orange" | "pink" | "teal";

export const THEME_OPTIONS: { id: ThemeId; label: string; light: string; dark: string }[] = [
  { id: "green", label: "Verde", light: "#16a34a", dark: "#22c55e" },
  { id: "blue", label: "Azul", light: "#2563eb", dark: "#3b82f6" },
  { id: "purple", label: "Roxo", light: "#7c3aed", dark: "#a78bfa" },
  { id: "orange", label: "Laranja", light: "#ea580c", dark: "#fb923c" },
  { id: "pink", label: "Rosa", light: "#db2777", dark: "#f472b6" },
  { id: "teal", label: "Verde-água", light: "#0d9488", dark: "#2dd4bf" },
];

export const DEFAULT_THEME: ThemeId = "green";

export function resolveTheme(id: string) {
  return THEME_OPTIONS.find((t) => t.id === id) ?? THEME_OPTIONS.find((t) => t.id === DEFAULT_THEME)!;
}
