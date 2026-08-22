import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { from } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            €
          </span>
          <h1 className="text-lg font-semibold">Gastos — Gestor Financeiro</h1>
          <p className="mt-1 text-sm text-foreground-muted">Regista e acompanha as despesas de casa</p>
        </div>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
