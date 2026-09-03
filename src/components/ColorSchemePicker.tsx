"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { updateColorScheme, type ActionState } from "@/app/(app)/preferencias/actions";
import { COLOR_SCHEME_OPTIONS, type ColorSchemeId } from "@/lib/colorScheme";

const idleState: ActionState = { status: "idle" };

export function ColorSchemePicker({ current }: { current: ColorSchemeId }) {
  const [selected, setSelected] = useState<ColorSchemeId>(current);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function escolher(colorScheme: ColorSchemeId) {
    setSelected(colorScheme);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("colorScheme", colorScheme);
      const result = await updateColorScheme(idleState, formData);

      if (result.status === "success") {
        setMessage({ ok: true, text: result.message ?? "Guardado." });
      } else {
        setSelected(current);
        setMessage({ ok: false, text: result.message ?? "Não foi possível guardar." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit rounded-xl border border-border bg-surface-muted p-1">
        {COLOR_SCHEME_OPTIONS.map((option) => {
          const active = option.id === selected;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              disabled={isPending}
              onClick={() => escolher(option.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                active ? "bg-surface text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground",
              )}
            >
              <Icon size={14} />
              {option.label}
            </button>
          );
        })}
      </div>
      {message && (
        <p className={`text-sm ${message.ok ? "text-foreground-muted" : "text-danger"}`}>{message.text}</p>
      )}
    </div>
  );
}
