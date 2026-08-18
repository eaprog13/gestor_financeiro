import { formatCurrency, formatMonthLabel } from "@/lib/format";

export function SummaryCards({
  monthTotal,
  todayTotal,
  monthCount,
}: {
  monthTotal: number;
  todayTotal: number;
  monthCount: number;
}) {
  const items = [
    { label: formatMonthLabel(new Date()), value: formatCurrency(monthTotal) },
    { label: "Hoje", value: formatCurrency(todayTotal) },
    { label: "Registos este mês", value: String(monthCount) },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-surface p-3 sm:p-4"
        >
          <p className="truncate text-xs font-medium text-foreground-muted">
            {item.label}
          </p>
          <p className="mt-1 truncate text-lg font-semibold sm:text-xl">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
