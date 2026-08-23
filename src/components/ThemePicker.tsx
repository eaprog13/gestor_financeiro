"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateTheme, type ActionState } from "@/app/(app)/preferencias/actions";
import { THEME_OPTIONS, type ThemeId } from "@/lib/theme";

const idleState: ActionState = { status: "idle" };

export function ThemePicker({ current }: { current: ThemeId }) {
  const [selected, setSelected] = useState<ThemeId>(current);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function escolher(theme: ThemeId) {
    setSelected(theme);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("theme", theme);
      const result = await updateTheme(idleState, formData);

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
      <div className="flex flex-wrap gap-3">
        {THEME_OPTIONS.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={active}
              disabled={isPending}
              onClick={() => escolher(option.id)}
              style={{ backgroundColor: option.light }}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:opacity-60"
            >
              {active && <Check size={16} className="text-white" />}
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
