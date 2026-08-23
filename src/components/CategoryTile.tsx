"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Pencil, X } from "lucide-react";
import { updateCategory, type CategoryFormState } from "@/app/actions";
import { ICON_MAP, ICON_OPTIONS, COLOR_OPTIONS } from "@/lib/icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton";
import type { Category } from "@/core/types";

const idleState: CategoryFormState = { status: "idle" };

/**
 * Uma categoria da grelha em src/app/(app)/categorias/page.tsx — mostra a
 * vista normal (ícone + nome + ações) ou, ao clicar em "Editar", troca por
 * um formulário inline com os mesmos campos do NewCategoryForm (nome, ícone,
 * cor), pré-preenchido. Categorias base (isDefault) podem ser editadas
 * (nome/ícone/cor) na mesma — só não podem ser apagadas, ver categoryService.ts.
 */
export function CategoryTile({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancelar() {
    setIcon(category.icon);
    setColor(category.color);
    setError(null);
    setEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await updateCategory(category.id, idleState, formData);
      if (result.status === "success") {
        setEditing(false);
      } else {
        setError(result.message ?? "Não foi possível guardar a categoria.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3">
        <CategoryIcon icon={category.icon} color={category.color} size={16} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
        <button
          type="button"
          aria-label={`Editar categoria: ${category.name}`}
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-accent"
        >
          <Pencil size={14} />
        </button>
        {!category.isDefault && <DeleteCategoryButton id={category.id} name={category.name} />}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="col-span-full flex flex-col gap-4 rounded-2xl border border-accent bg-surface p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Editar categoria</h2>
        <button
          type="button"
          onClick={cancelar}
          aria-label="Cancelar edição"
          className="text-xs font-medium text-foreground-muted hover:underline"
        >
          <X size={14} />
        </button>
      </div>

      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
        Nome
        <input
          required
          type="text"
          name="name"
          maxLength={40}
          defaultValue={category.name}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="mb-1.5 text-xs font-medium text-foreground-muted">Ícone</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {ICON_OPTIONS.map((option) => {
            const Icon = ICON_MAP[option.name];
            const active = option.name === icon;
            return (
              <button
                key={option.name}
                type="button"
                title={option.label}
                onClick={() => setIcon(option.name)}
                className={`flex h-9 items-center justify-center rounded-lg border transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-transparent bg-surface-muted text-foreground-muted hover:text-foreground"
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-foreground-muted">Cor</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((option) => {
            const active = option === color;
            return (
              <button
                key={option}
                type="button"
                title={option}
                onClick={() => setColor(option)}
                style={{ backgroundColor: option }}
                className="flex h-7 w-7 items-center justify-center rounded-full"
              >
                {active && <Check size={14} className="text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? "A guardar…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={cancelar}
          disabled={isPending}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground-muted disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
