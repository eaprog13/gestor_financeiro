import { Flame } from "lucide-react";
import clsx from "clsx";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Expense } from "@/core/types";
import type { ExpenseTier } from "@/lib/metrics";

// Jogo de cores para despesas grandes (ver lib/metrics.ts,
// classificarMagnitude): uma família própria — dourado (--flag) — que não
// reutiliza o verde/vermelho já usados em KpiCard/MoversList para "gastei
// mais/menos que o período anterior". Uma despesa grande não é "boa" nem
// "má", só notável. Mesmo padrão de "tinta suave" (bg-flag/N text-flag) já
// usado pelo DeltaPill do KpiCard — nunca uma cor sólida a preencher a
// linha, para continuar legível com qualquer cor de destaque escolhida em
// /preferencias. Quanto maior a janela de que é recorde (dia < semana <
// mês < ano), mais forte a tinta e o peso do texto.
const TIER_STYLE: Record<ExpenseTier, { label: string; wash: string; text: string; flame: string } | null> = {
  // Mesma tinta --flag, mas sem fundo (só o texto/ícone) e a esmaecer — é um
  // aviso mais brando que os "record-*" a seguir: ainda não bateu recorde
  // nenhum, só está perto (≥70%) do recorde do mês (ver classificarMagnitude).
  "near-record-month": { label: "Quase recorde do mês", wash: "", text: "text-flag/70", flame: "opacity-40" },
  "record-day": { label: "Maior do dia", wash: "bg-flag/5", text: "text-flag", flame: "opacity-60" },
  "record-week": { label: "Maior da semana", wash: "bg-flag/10", text: "text-flag font-medium", flame: "" },
  "record-month": { label: "Maior do mês", wash: "bg-flag/15", text: "text-flag font-semibold", flame: "" },
  "record-year": {
    label: "Maior do ano",
    wash: "bg-flag/20 border-l-2 border-flag",
    text: "text-flag font-bold",
    flame: "",
  },
  normal: null,
};

export function ExpenseRow({
  expense,
  showDate = false,
}: {
  expense: Expense & { category: Category; tier?: ExpenseTier };
  showDate?: boolean;
}) {
  const style = TIER_STYLE[expense.tier ?? "normal"];

  return (
    <div className={clsx("flex items-center gap-3 rounded-lg py-2.5", style && ["-mx-2 px-2", style.wash])}>
      <CategoryIcon icon={expense.category.icon} color={expense.category.color} size={16} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.category.name}</p>
        <p className="truncate text-xs text-foreground-muted">
          {[showDate ? formatDate(expense.date) : null, expense.note].filter(Boolean).join(" · ") || "—"}
          {style && (
            <span className={clsx("ml-1.5 inline-flex items-center gap-0.5 font-medium text-flag")}>
              <Flame size={11} className={style.flame} /> {style.label}
            </span>
          )}
        </p>
      </div>
      <span className={clsx("shrink-0 text-sm tabular-nums", style ? style.text : "font-semibold")}>
        {formatCurrency(expense.amount)}
      </span>
      <DeleteExpenseButton
        id={expense.id}
        label={`${expense.category.name} — ${formatCurrency(expense.amount)}`}
      />
    </div>
  );
}
