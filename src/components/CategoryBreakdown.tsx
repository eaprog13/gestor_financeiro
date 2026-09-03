import { CategoryIcon } from "@/components/CategoryIcon";
import { formatCurrency } from "@/lib/format";
import type { Category } from "@/core/types";

const MAX_ROWS = 8;

export function CategoryBreakdown({
  breakdown,
  yearTotal,
  year,
}: {
  breakdown: { category: Category; total: number }[];
  yearTotal: number;
  year: number;
}) {
  if (breakdown.length === 0 || yearTotal <= 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground-muted">
          Despesas por categoria · {year}
        </h2>
        <p className="py-6 text-center text-sm text-foreground-muted">
          Sem despesas este ano para mostrar aqui.
        </p>
      </div>
    );
  }

  const visible = breakdown.slice(0, MAX_ROWS);
  const rest = breakdown.slice(MAX_ROWS);
  const restTotal = rest.reduce((sum, entry) => sum + entry.total, 0);

  const rows = [
    ...visible.map((entry) => ({
      key: entry.category.id,
      name: entry.category.name,
      icon: entry.category.icon,
      color: entry.category.color,
      total: entry.total,
    })),
    ...(rest.length > 0
      ? [
          {
            key: "outras",
            name: `Outras (${rest.length})`,
            icon: "MoreHorizontal",
            color: "#6b7280",
            total: restTotal,
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground-muted">
        Despesas por categoria · {year}
      </h2>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const percent = yearTotal > 0 ? (row.total / yearTotal) * 100 : 0;
          return (
            <div key={row.key} className="flex items-center gap-3">
              <CategoryIcon icon={row.icon} color={row.color} size={14} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{row.name}</span>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {formatCurrency(row.total)} · {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(percent, 2)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
