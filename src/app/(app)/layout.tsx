import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { obterContentor } from "@/composition/container";
import { resolveTheme } from "@/lib/theme";
import { resolveColorScheme } from "@/lib/colorScheme";
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
  // "system" não escreve o atributo — o CSS já segue prefers-color-scheme
  // por defeito (ver globals.css); só "light"/"dark" precisam de o forçar.
  const colorScheme = resolveColorScheme(perfil?.colorScheme ?? "");
  const modo = colorScheme === "system" ? undefined : colorScheme;

  return (
    <div
      data-theme={tema.id}
      data-mode={modo}
      className="flex min-h-screen flex-1 flex-col bg-background text-foreground"
    >
      {/* bg-background/text-foreground aqui — não só no <body> do layout
          raiz — porque quando data-mode força "light"/"dark" contra o
          prefers-color-scheme do sistema, as variáveis --background/
          --foreground ficam diferentes NESTE div (ver globals.css,
          div[data-mode]); sem pintar o fundo aqui, continuava a
          aparecer o do <body> por trás (nunca sobrescrito, por estar
          fora deste grupo de rotas) — texto escuro sobre fundo escuro
          do body, ilegível. min-h-screen (não min-h-full): html/body
          não têm height:100% definido, min-h-full ficava sem base para
          garantir a altura toda do ecrã coberta.
          Seletor "div[data-theme=...]" (specificity 0,0,1,1) para garantir
          que ganha ao ":root" de globals.css (0,0,1,0) mesmo se a ordem no
          documento alguma vez mudar — não depende de vir depois no HTML. */}
      <style>{`
        div[data-theme="${tema.id}"] { --accent: ${tema.light}; }
        @media (prefers-color-scheme: dark) {
          div[data-theme="${tema.id}"]:not([data-mode="light"]) { --accent: ${tema.dark}; }
        }
        div[data-theme="${tema.id}"][data-mode="dark"] { --accent: ${tema.dark}; }
      `}</style>
      <Nav userName={session.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
