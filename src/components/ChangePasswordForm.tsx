"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type ActionState } from "@/app/change-password/actions";

const initialState: ActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "A guardar…" : "Guardar nova password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nova password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirmar password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
