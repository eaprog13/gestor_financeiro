import { getUsers } from "@/lib/data";
import { EditUserForm } from "@/components/EditUserForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Utilizadores</h1>
      <p className="max-w-xl text-sm text-foreground-muted">
        Todos os utilizadores partilham os mesmos dados — não há despesas separadas por pessoa. As contas são criadas só no painel do Supabase (Authentication → Users) —
        a app não cria contas.
      </p>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">Utilizadores existentes</h2>
        <ul className="flex flex-col divide-y divide-border text-sm">
          {users.map((user) => (
            <EditUserForm key={user.id} user={user} />
          ))}
        </ul>
      </section>
    </div>
  );
}
