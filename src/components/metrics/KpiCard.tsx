import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import clsx from "clsx";
import { formatPercent } from "@/lib/format";
import type { Delta } from "@/lib/metrics";

/**
 * Headline stat with an optional delta pill. Every metric here is a spending
 * total, so the color semantics are fixed: spending more than the comparison
 * period is bad (danger), spending less is good (accent).
 */
export function KpiCard({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub: string;
  delta?: Delta;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <p className="truncate text-xs font-medium text-foreground-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
      {/* "sub" (ex.: "vs mês passado") cortava a meio da palavra mesmo com
          espaço de sobra no cartão — troca para "quebra se precisar" em
          vez de "corta sempre". */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {delta && <DeltaPill percent={delta.percent} />}
        <span className="text-foreground-muted">{sub}</span>
      </div>
    </div>
  );
}

function DeltaPill({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-surface-muted px-1.5 py-0.5 font-semibold text-foreground-muted">
        novo
      </span>
    );
  }

  const flat = Math.abs(percent) < 0.5;
  const up = percent > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
        flat
          ? "bg-surface-muted text-foreground-muted"
          : up
            ? "bg-danger/10 text-danger"
            : "bg-accent/10 text-accent",
      )}
    >
      <Icon size={12} />
      {formatPercent(percent)}
    </span>
  );
}
