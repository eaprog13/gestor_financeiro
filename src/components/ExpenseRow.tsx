import { CategoryIcon } from "@/components/CategoryIcon";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Expense } from "@/core/types";

export function ExpenseRow({
  expense,
  showDate = false,
}: {
  expense: Expense & { category: Category };
  showDate?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <CategoryIcon icon={expense.category.icon} color={expense.category.color} size={16} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.category.name}</p>
        <p className="truncate text-xs text-foreground-muted">
          {[showDate ? formatDate(expense.date) : null, expense.note]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(expense.amount)}
      </span>
      <DeleteExpenseButton
        id={expense.id}
        label={`${expense.category.name} — ${formatCurrency(expense.amount)}`}
      />
    </div>
  );
}
