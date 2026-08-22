import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O proxy (src/proxy.ts) já protege as rotas — esta verificação é uma
  // segunda linha de defesa (defesa em profundidade), como recomendado pela
  // documentação do Next.js para Server Functions.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Nav userName={session.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:pb-10">{children}</main>
    </>
  );
}
