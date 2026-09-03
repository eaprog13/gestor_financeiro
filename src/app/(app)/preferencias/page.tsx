import { getSession } from "@/lib/auth/session";
import { obterContentor } from "@/composition/container";
import { ThemePicker } from "@/components/ThemePicker";
import { ColorSchemePicker } from "@/components/ColorSchemePicker";
import { resolveTheme } from "@/lib/theme";
import { resolveColorScheme } from "@/lib/colorScheme";

export const dynamic = "force-dynamic";

export default async function PreferenciasPage() {
  // Ver comentário em (app)/layout.tsx: sessão já garantida pelo layout;
  // repetido aqui só para obter o "sub" e ir buscar o perfil.
  const session = await getSession();
  const perfil = session ? await obterContentor().perfis.obterPorId(session.sub) : null;
  const tema = resolveTheme(perfil?.theme ?? "");
  const colorScheme = resolveColorScheme(perfil?.colorScheme ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Preferências</h1>
        <p className="mt-1 max-w-xl text-sm text-foreground-muted">
          Só afeta a tua sessão — cada membro da família pode escolher a sua própria aparência.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">Cor de destaque</h2>
        <ThemePicker current={tema.id} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-semibold">Modo de cor</h2>
        <p className="mb-4 text-xs text-foreground-muted">
          “Sistema” segue o que tens definido no telemóvel/computador. Escolhe “Claro” ou “Escuro” para fixar,
          independentemente disso.
        </p>
        <ColorSchemePicker current={colorScheme} />
      </section>
    </div>
  );
}
