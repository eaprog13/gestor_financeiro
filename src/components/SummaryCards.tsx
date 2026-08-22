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
      {items.map((item, index) => (
        <div
          key={item.label}
          className="animate-entrada min-w-0 rounded-2xl border border-border bg-surface p-3 transition-colors duration-200 hover:border-accent/40 sm:p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* Antes truncava com "…" mesmo sem espaço para isso ser
              necessário (ex.: "Registos este mês" em ecrãs de 375px, com 3
              cartões na mesma linha) — quebra em 2 linhas em vez de cortar
              o texto, sempre legível independentemente da largura. */}
          <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground-muted">
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
