"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { updateCategoryView } from "@/app/actions";

/**
 * Um único <select> — o "burguer ou botão" pedido para trocar entre "ano
 * inteiro" e um mês concreto em "Despesas por categoria". A troca de vista
 * em si é imediata (router.replace, o dashboard volta a renderizar no
 * servidor com os dados certos); guardar como novo valor por defeito
 * (profiles.category_view) corre a par, sem bloquear a navegação.
 */
export function CategoryViewPicker({
  current,
  monthOptions,
}: {
  current: string;
  monthOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function escolher(view: string) {
    router.replace(`${pathname}?view=${view}`);
    startTransition(() => {
      updateCategoryView(view);
    });
  }

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(event) => escolher(event.target.value)}
      aria-label="Vista de Despesas por categoria"
      className="shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground-muted outline-none transition-colors hover:border-accent/40 focus:border-accent disabled:opacity-60"
    >
      <option value="year">Ano inteiro</option>
      {monthOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
