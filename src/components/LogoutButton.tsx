"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-foreground-muted transition-all duration-200 ease-out hover:bg-surface-muted hover:text-foreground active:scale-95"
      >
        <LogOut size={16} aria-hidden />
        Sair
      </button>
    </form>
  );
}
