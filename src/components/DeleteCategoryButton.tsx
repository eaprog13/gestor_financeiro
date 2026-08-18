"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/app/actions";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={`Apagar categoria: ${name}`}
      onClick={() => {
        if (!confirm(`Apagar a categoria "${name}"?`)) return;
        startTransition(async () => {
          const result = await deleteCategory(id);
          if (!result.ok) {
            alert(result.message ?? "Não foi possível apagar a categoria.");
          }
        });
      }}
      className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-danger disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
