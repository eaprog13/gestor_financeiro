"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { X } from "lucide-react";
import { createExpense, type ExpenseFormState } from "@/app/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { toDateInputValue } from "@/lib/format";
import type { Category } from "@/core/types";

const idleState: ExpenseFormState = { status: "idle" };

export function QuickAddPanel({ categories }: { categories: Category[] }) {
  const [selected, setSelected] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createExpense(idleState, formData);
      if (result.status === "success") {
        formRef.current?.reset();
        setToast(result.message ?? null);
        setTimeout(() => setSelected(null), 900);
        setTimeout(() => setToast(null), 2600);
      } else {
        setError(result.message ?? "Não foi possível guardar.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground-muted">
          Registo rápido
        </h2>
        {toast && (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            {toast}
          </span>
        )}
      </div>

      {!selected ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setError(null);
                setSelected(category);
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-transparent bg-surface-muted px-2 py-3 text-center transition-colors hover:border-border active:scale-[0.98]"
            >
              <CategoryIcon icon={category.icon} color={category.color} size={18} />
              <span className="text-xs font-medium leading-tight">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          key={selected.id}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="categoryId" value={selected.id} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon icon={selected.icon} color={selected.color} size={18} />
              <span className="font-medium">{selected.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-full p-1.5 text-foreground-muted hover:bg-surface-muted"
              aria-label="Cancelar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
              Valor (€)
              <input
                autoFocus
                required
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0,00"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
              Data
              <input
                required
                type="date"
                name="date"
                defaultValue={toDateInputValue()}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
            Nota (opcional)
            <input
              type="text"
              name="note"
              maxLength={200}
              placeholder="ex: compras da semana"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-60"
          >
            {isPending ? "A guardar…" : "Guardar despesa"}
          </button>
        </form>
      )}
    </div>
  );
}
