"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/actions";

export function DeleteExpenseButton({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={`Apagar despesa: ${label}`}
      onClick={() => {
        if (confirm(`Apagar "${label}"?`)) {
          startTransition(() => {
            void deleteExpense(id);
          });
        }
      }}
      className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-danger disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
