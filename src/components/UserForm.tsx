"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser, type ActionState } from "@/app/(app)/settings/users/actions";

const initialState: ActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
    >
      {pending ? "A criar…" : "Criar utilizador"}
    </button>
  );
}

export function UserForm() {
  const [state, formAction] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground-muted">
        Nome
        <input
          name="name"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground-muted">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground-muted">
        Password
        <input
          name="password"
          type="password"
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
      {state.status === "success" ? (
        <p className="text-sm font-medium text-accent">{state.message}</p>
      ) : null}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
