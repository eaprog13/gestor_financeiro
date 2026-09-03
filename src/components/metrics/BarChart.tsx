import { formatCurrency } from "@/lib/format";
import type { SeriesPoint } from "@/lib/metrics";

/**
 * Minimal bar chart for period totals (daily/weekly/monthly/annual series, and
 * year-over-year comparisons via `value2`). Pure CSS — no client JS: the hover
 * tooltip is a `group-hover` reveal, so this stays a server component.
 *
 * `heat`: colore cada barra por magnitude relativa ao resto da série — verde
 * (--accent, o mais baixo) a vermelho (--danger, o mais alto), passando por
 * dourado (--flag) a meio — em vez da cor fixa "accent". Só faz sentido
 * quando a cor da barra não já significa outra coisa, por isso é mutuamente
 * exclusivo com `legend` (aí a cor identifica "este ano" vs. "ano passado").
 * `average`: desenha uma linha de referência tracejada na média do período.
 */
export function BarChart({
  data,
  legend,
  heat = false,
  average,
}: {
  data: SeriesPoint[];
  legend?: [primary: string, comparison: string];
  heat?: boolean;
  average?: number;
}) {
  const max = Math.max(1, ...data.flatMap((point) => [point.value, point.value2 ?? 0]));
  const hasComparison = data.some((point) => point.value2 !== undefined);
  const values = data.map((point) => point.value).filter((value) => value > 0);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const showHeat = heat && !hasComparison;
  const averageHeightPercent =
    average !== undefined && average > 0 ? Math.min(barHeight(average, max), 100) : undefined;

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
      {showHeat && (
        <div className="mb-3 flex items-center gap-4 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Menor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-flag" />
            Maior
          </span>
          {averageHeightPercent !== undefined && (
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-2.5 border-t-2 border-dashed border-foreground-muted" />
              Média
            </span>
          )}
        </div>
      )}
      <div className="relative flex h-28 items-end gap-1 sm:gap-1.5">
        {averageHeightPercent !== undefined && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-foreground-muted/50"
            style={{ bottom: `${averageHeightPercent}%` }}
          />
        )}
        {data.map((point, index) => (
          <div key={`${point.label}-${index}`} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-8 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium text-background group-hover:block">
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
                style={{
                  height: `${barHeight(point.value, max)}%`,
                  animationDelay: `${index * 20}ms`,
                  backgroundColor: showHeat ? heatColor(point.value, min, max) : undefined,
                }}
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

/** Verde (--accent) → dourado (--flag) → vermelho (--danger), consoante a
 * posição de `value` entre o mínimo e o máximo da série. `color-mix` lê as
 * custom properties diretamente, por isso o gradiente já sai correto em
 * qualquer tema/cor de destaque sem precisar de JS no cliente. */
function heatColor(value: number, min: number, max: number) {
  if (value <= 0 || max <= min) return "var(--accent)";
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
  if (t <= 0.5) {
    const p = (t / 0.5) * 100;
    return `color-mix(in oklch, var(--flag) ${p}%, var(--accent) ${100 - p}%)`;
  }
  const p = ((t - 0.5) / 0.5) * 100;
  return `color-mix(in oklch, var(--danger) ${p}%, var(--flag) ${100 - p}%)`;
}
