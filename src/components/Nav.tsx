"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListTree, Tags } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Início", icon: LayoutGrid },
  { href: "/historico", label: "Histórico", icon: ListTree },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              €
            </span>
            <span>Gastos</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-muted text-foreground"
                      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur sm:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-accent" : "text-foreground-muted",
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
