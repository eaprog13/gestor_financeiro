import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { obterContentor } from "@/composition/container";
import { resolveTheme } from "@/lib/theme";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O proxy (src/proxy.ts) já protege as rotas — esta verificação é uma
  // segunda linha de defesa (defesa em profundidade), como recomendado pela
  // documentação do Next.js para Server Functions.
  const session = await getSession();
  if (!session) redirect("/login");

  // "theme" não vem da sessão (essa é só o que está em auth.users/
  // user_metadata) — tem de se ir buscar ao perfil em profiles. Só afeta
  // --accent para esta pessoa; páginas fora do grupo (app) (login,
  // forgot-password) ficam com a cor por defeito, o que está bem — ainda
  // ninguém autenticou para haver preferência a aplicar.
  const perfil = await obterContentor().perfis.obterPorId(session.sub);
  const tema = resolveTheme(perfil?.theme ?? "");

  return (
    <div data-theme={tema.id} className="flex min-h-full flex-1 flex-col">
      {/* Seletor "div[data-theme=...]" (specificity 0,0,1,1) para garantir
          que ganha ao ":root" de globals.css (0,0,1,0) mesmo se a ordem no
          documento alguma vez mudar — não depende de vir depois no HTML. */}
      <style>{`
        div[data-theme="${tema.id}"] { --accent: ${tema.light}; }
        @media (prefers-color-scheme: dark) {
          div[data-theme="${tema.id}"] { --accent: ${tema.dark}; }
        }
      `}</style>
      <Nav userName={session.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:pb-10">{children}</main>
    </div>
  );
}
