"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { createCategory, type CategoryFormState } from "@/app/actions";
import { ICON_MAP, ICON_OPTIONS, COLOR_OPTIONS } from "@/lib/icons";

const idleState: CategoryFormState = { status: "idle" };

export function NewCategoryForm() {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(ICON_OPTIONS[0].name);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createCategory(idleState, formData);
      if (result.status === "success") {
        formRef.current?.reset();
        setIcon(ICON_OPTIONS[0].name);
        setColor(COLOR_OPTIONS[0]);
        setOpen(false);
      } else {
        setError(result.message ?? "Não foi possível criar a categoria.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm font-medium text-foreground-muted hover:border-accent hover:text-accent"
      >
        <Plus size={16} />
        Nova categoria
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Nova categoria</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-foreground-muted hover:underline"
        >
          Cancelar
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
          placeholder="ex: Ginásio"
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

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "A criar…" : "Criar categoria"}
      </button>
    </form>
  );
}
