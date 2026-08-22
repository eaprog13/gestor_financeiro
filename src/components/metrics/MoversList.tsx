import clsx from "clsx";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatPercent } from "@/lib/format";
import type { Mover } from "@/lib/metrics";

/** Categories that grew or shrank the most vs. last month — where to look to cut costs. */
export function MoversList({ movers }: { movers: Mover[] }) {
  const increases = movers.filter((mover) => mover.diff > 0).slice(0, 3);
  const decreases = movers
    .filter((mover) => mover.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  if (increases.length === 0 && decreases.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-foreground-muted">
        Sem dados do mês passado para comparar categorias ainda.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MoverColumn title="Maiores subidas" items={increases} tone="danger" />
      <MoverColumn title="Maiores descidas" items={decreases} tone="accent" />
    </div>
  );
}

function MoverColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: Mover[];
  tone: "danger" | "accent";
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">Nada a assinalar.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((mover) => (
            <div key={mover.category.id} className="flex items-center gap-2.5">
              <CategoryIcon icon={mover.category.icon} color={mover.category.color} size={14} />
              <span className="min-w-0 flex-1 truncate text-sm">{mover.category.name}</span>
              <span
                className={clsx(
                  "shrink-0 text-xs font-semibold",
                  tone === "danger" ? "text-danger" : "text-accent",
                )}
              >
                {mover.percent === null ? "novo" : formatPercent(mover.percent)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
