import { formatCurrency } from "@/lib/format";
import type { SeriesPoint } from "@/lib/metrics";

/**
 * Minimal bar chart for period totals (daily/weekly/monthly/annual series, and
 * year-over-year comparisons via `value2`). Pure CSS — no client JS: the hover
 * tooltip is a `group-hover` reveal, so this stays a server component.
 */
export function BarChart({
  data,
  legend,
}: {
  data: SeriesPoint[];
  legend?: [primary: string, comparison: string];
}) {
  const max = Math.max(1, ...data.flatMap((point) => [point.value, point.value2 ?? 0]));
  const hasComparison = data.some((point) => point.value2 !== undefined);

  return (
    <div>
      {legend && (
        <div className="mb-3 flex items-center gap-4 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {legend[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground-muted/30" />
            {legend[1]}
          </span>
        </div>
      )}
      <div className="flex h-28 items-end gap-1 sm:gap-1.5">
        {data.map((point, index) => (
          <div key={`${point.label}-${index}`} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium text-background group-hover:block">
              {formatCurrency(point.value)}
              {point.value2 !== undefined ? ` · ${formatCurrency(point.value2)}` : ""}
            </div>
            <div className="flex h-full items-end gap-0.5">
              {hasComparison && (
                <div
                  className="barra-cresce-vertical min-h-0 flex-1 rounded-t-[3px] bg-foreground-muted/30"
                  style={{ height: `${barHeight(point.value2 ?? 0, max)}%`, animationDelay: `${index * 20}ms` }}
                />
              )}
              <div
                className="barra-cresce-vertical min-h-0 flex-1 rounded-t-[3px] bg-accent"
                style={{ height: `${barHeight(point.value, max)}%`, animationDelay: `${index * 20}ms` }}
              />
            </div>
            <span className="mt-1.5 block truncate text-center text-[10px] text-foreground-muted">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function barHeight(value: number, max: number) {
  if (value <= 0) return 0;
  return Math.max((value / max) * 100, 3);
}
