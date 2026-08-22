"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, X } from "lucide-react";
import { updateUser, type ActionState } from "@/app/(app)/settings/users/actions";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/core/types";

const initialState: ActionState = { status: "idle" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
    >
      {pending ? "A guardar…" : "Guardar"}
    </button>
  );
}

export function EditUserForm({ user }: { user: Profile }) {
  const [aEditar, setAEditar] = useState(false);
  const updateUserComId = updateUser.bind(null, user.id);
  const [state, formAction] = useActionState(updateUserComId, initialState);

  // Fecha o formulário assim que a alteração é guardada com sucesso — ajuste
  // de estado durante a renderização (em vez de um efeito) para evitar o
  // duplo render que um useEffect a chamar setState causaria (ver "You
  // Might Not Need an Effect" na documentação do React).
  const [ultimoEstadoVisto, setUltimoEstadoVisto] = useState(state);
  if (state !== ultimoEstadoVisto) {
    setUltimoEstadoVisto(state);
    if (state.status === "success" && aEditar) setAEditar(false);
  }

  if (aEditar) {
    return (
      <li className="flex flex-col gap-1.5 py-2.5">
        <form action={formAction} className="flex items-center gap-2">
          <input
            name="name"
            defaultValue={user.name}
            required
            minLength={2}
            maxLength={80}
            autoFocus
            className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
          <SaveButton />
          <button
            type="button"
            onClick={() => setAEditar(false)}
            title="Cancelar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        </form>
        {state.status === "error" ? <p className="text-xs text-danger">{state.message}</p> : null}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between py-2.5">
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-foreground-muted">{user.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-foreground-muted">desde {formatDate(user.createdAt)}</span>
        <button
          type="button"
          onClick={() => setAEditar(true)}
          title="Editar nome"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        >
          <Pencil size={14} />
        </button>
      </div>
    </li>
  );
}
