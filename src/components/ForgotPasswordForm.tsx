"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pedirLinkRecuperacao, type ActionState } from "@/app/forgot-password/actions";

const estadoInicial: ActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkInvalido = searchParams.get("erro") === "link_invalido";

  // O pedido corre no servidor (src/app/forgot-password/actions.ts): o
  // browser não fala com o fornecedor de autenticação. A resposta é sempre a
  // mesma, quer o email exista como conta quer não.
  const [state, formAction, aEnviar] = useActionState(pedirLinkRecuperacao, estadoInicial);

  if (state.status === "enviado") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm">
          Se existir uma conta com o email <strong>{state.email}</strong>, vais receber uma mensagem com um
          link para definires uma nova password.
        </p>
        <p className="text-xs text-foreground-muted">
          Não recebeste nada em alguns minutos? Verifica o spam ou tenta de novo.
        </p>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      ) : null}

      {linkInvalido && (
        <p role="alert" className="text-sm font-medium text-danger">
          Esse link de recuperação já não é válido ou expirou. Pede um novo abaixo.
        </p>
      )}

      <button
        type="submit"
        disabled={aEnviar}
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {aEnviar ? "A enviar…" : "Enviar link de recuperação"}
      </button>

      <Link href="/login" className="text-center text-sm text-foreground-muted hover:underline">
        Voltar ao login
      </Link>
    </form>
  );
}
