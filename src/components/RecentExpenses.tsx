import Link from "next/link";
import { ExpenseRow } from "@/components/ExpenseRow";
import type { Category, Expense } from "@/core/types";
import type { ExpenseTier } from "@/lib/metrics";

export function RecentExpenses({
  expenses,
}: {
  expenses: (Expense & { category: Category; tier?: ExpenseTier })[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground-muted">
          Últimos registos
        </h2>
        <Link
          href="/historico"
          className="text-xs font-medium text-accent hover:underline"
        >
          Ver histórico
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">
          Ainda não há despesas registadas. Usa o registo rápido acima.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} showDate />
          ))}
        </div>
      )}
    </div>
  );
}
