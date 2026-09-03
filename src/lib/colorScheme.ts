import { Monitor, Moon, Sun } from "lucide-react";

// Claro/escuro/sistema — separado da cor de destaque (ver src/lib/theme.ts):
// "sistema" é o comportamento de sempre (segue prefers-color-scheme, ver
// globals.css); "claro"/"escuro" fixam o modo independentemente do sistema
// operativo — só dentro do grupo (app), mesma limitação já aceite para a
// cor de destaque (ver comentário em (app)/layout.tsx: antes de autenticar
// ainda não há preferência a aplicar).
export type ColorSchemeId = "system" | "light" | "dark";

export const COLOR_SCHEME_OPTIONS: { id: ColorSchemeId; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
];

export const DEFAULT_COLOR_SCHEME: ColorSchemeId = "system";

export function resolveColorScheme(id: string): ColorSchemeId {
  return COLOR_SCHEME_OPTIONS.find((option) => option.id === id)?.id ?? DEFAULT_COLOR_SCHEME;
}
