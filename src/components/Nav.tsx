"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, LayoutGrid, ListTree, Menu, Tags, Users, X } from "lucide-react";
import clsx from "clsx";
import { LogoutButton } from "@/components/LogoutButton";

// Um único array — todos os itens com o mesmo tratamento (ícone + rótulo),
// incluindo "Utilizadores": antes vivia à parte, como botão só-ícone
// misturado com o nome/sair, o que quebrava a coerência visual do menu.
const links = [
  { href: "/", label: "Início", icon: LayoutGrid },
  { href: "/historico", label: "Histórico", icon: ListTree },
  { href: "/metricas", label: "Métricas", icon: Gauge },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/settings/users", label: "Utilizadores", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();
  // Só existe entre 640–767px ("sm" até "md"): abaixo disso a barra de
  // separadores em baixo já dá acesso a tudo; a partir de "md" o menu
  // completo volta a caber na horizontal (ver classes sm:flex/md:hidden
  // no botão e hidden/md:flex no <nav> ao lado). Fecha sozinho ao mudar
  // de página, para nunca ficar aberto por cima do conteúdo novo.
  const [menuAberto, setMenuAberto] = useState(false);
  // Sem useEffect: ajustar estado durante o render em resposta a uma prop
  // que mudou é o padrão recomendado pelo React (evita o re-render extra
  // de um efeito) e resolve o aviso do eslint (react-hooks/set-state-in-effect).
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setMenuAberto(false);
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        {/* Grid "1fr auto 1fr": as colunas dos lados dividem o espaço
            sobrante em partes IGUAIS entre si (ao contrário de "auto 1fr
            auto", em que só a coluna do meio recebia esse espaço) — só
            assim o menu fica realmente centrado, independentemente de o
            logótipo e as ações terem larguras diferentes. */}
        <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight justify-self-start">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              €
            </span>
            <span className="hidden sm:inline">Gastos</span>
          </Link>

          <nav className="hidden gap-1 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.97]",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Hamburguer: só na faixa 640–767px (ver comentário acima do
              estado). Ocupa a mesma coluna central do grid que o <nav>
              completo — nunca aparecem os dois ao mesmo tempo. */}
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-tablet"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className="hidden items-center justify-center rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground sm:flex md:hidden"
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center justify-self-end gap-2">
            <span className="hidden text-sm text-foreground-muted md:inline">{userName}</span>
            <LogoutButton />
          </div>
        </div>

        {menuAberto && (
          <nav id="menu-tablet" className="hidden flex-col gap-0.5 border-t border-border p-2 sm:flex md:hidden">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
            <div className="mt-1 border-t border-border px-3 pt-2 text-sm text-foreground-muted">{userName}</div>
          </nav>
        )}
      </header>

      {/* Mobile bottom tab bar — mesmo array, mesma ordem, agora com os 5 itens. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur sm:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200 ease-out active:scale-95",
                active ? "text-accent" : "text-foreground-muted",
              )}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
