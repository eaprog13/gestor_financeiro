import { Trophy, Flame } from "lucide-react";
import { getMetricsData } from "@/lib/metrics";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/metrics/KpiCard";
import { BarChart } from "@/components/metrics/BarChart";
import { MoversList } from "@/components/metrics/MoversList";
import { SectionCard } from "@/components/metrics/SectionCard";
import { CategoryIcon } from "@/components/CategoryIcon";

// KPIs cruzam despesas ao vivo em várias janelas de tempo — nunca uma cópia
// estática do build.
export const dynamic = "force-dynamic";

export default async function MetricasPage() {
  const { daily, weekly, monthly, annual, yearOverYear, highlights } = await getMetricsData();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Métricas</h1>
        <p className="text-sm text-foreground-muted">
          Cruza os teus gastos ao longo do tempo para perceberes onde estás a gastar mais e onde há margem para
          poupar.
        </p>
      </div>

      {/* 4 colunas só a partir de "md": a "sm" (640px) os cartões ainda
          ficavam estreitos demais para o texto "sub" (ex.: "vs mês
          passado") — ver KpiCard.tsx. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 sm:gap-3">
        <KpiCard
          label="Hoje"
          value={formatCurrency(daily.today)}
          sub="vs média diária"
          delta={daily.vsAverage30d}
        />
        <KpiCard
          label="Esta semana"
          value={formatCurrency(weekly.thisWeek)}
          sub="vs semana passada"
          delta={weekly.vsLastWeek}
        />
        <KpiCard
          label="Este mês"
          value={formatCurrency(monthly.thisMonth)}
          sub="vs mês passado"
          delta={monthly.vsLastMonth}
        />
        <KpiCard
          label="Este ano"
          value={formatCurrency(annual.thisYear)}
          sub="vs ano passado"
          delta={annual.vsLastYear}
        />
      </div>

      <SectionCard title="Diário" description="Últimos 14 dias.">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>
            Hoje vs ontem: <DeltaText delta={daily.vsYesterday} />
          </span>
          <span>Média (30 dias): {formatCurrency(daily.average30d)}</span>
        </div>
        <BarChart data={daily.series} />
      </SectionCard>

      <SectionCard title="Semanal" description="Últimas 8 semanas (segunda a domingo).">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>Média (7 semanas completas): {formatCurrency(weekly.average8w)}</span>
        </div>
        <BarChart data={weekly.series} />
      </SectionCard>

      <SectionCard title="Mensal" description="Últimos 12 meses.">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>Projeção fim do mês: {formatCurrency(monthly.projected)}</span>
          <span>Média (11 meses completos): {formatCurrency(monthly.average12m)}</span>
        </div>
        <BarChart data={monthly.series} />
        <div className="mt-5 border-t border-border pt-4">
          <MoversList movers={monthly.movers} />
        </div>
      </SectionCard>

      <SectionCard title="Anual" description="Total por ano civil.">
        <BarChart data={annual.series} />
      </SectionCard>

      <SectionCard title="Ano a ano" description="Cada mês, este ano contra o mesmo mês no ano passado.">
        <BarChart
          data={yearOverYear.series}
          legend={[yearOverYear.currentYearLabel, yearOverYear.previousYearLabel]}
        />
      </SectionCard>

      <SectionCard title="Destaques do mês">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
              <Trophy size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground-muted">Categoria com mais peso</p>
              {highlights.topCategory ? (
                <>
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    <CategoryIcon
                      icon={highlights.topCategory.category.icon}
                      color={highlights.topCategory.category.color}
                      size={12}
                    />
                    {highlights.topCategory.category.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {formatCurrency(highlights.topCategory.total)} · {highlights.topCategory.share.toFixed(0)}% do
                    mês
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">Sem despesas este mês.</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flag/15 text-flag">
              <Flame size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground-muted">Maior despesa</p>
              {highlights.biggestExpense ? (
                <>
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    <CategoryIcon
                      icon={highlights.biggestExpense.category.icon}
                      color={highlights.biggestExpense.category.color}
                      size={12}
                    />
                    {formatCurrency(highlights.biggestExpense.amount)}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {[formatDate(highlights.biggestExpense.date), highlights.biggestExpense.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">Sem despesas este mês.</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function DeltaText({ delta }: { delta: { percent: number | null } }) {
  if (delta.percent === null) return <span className="font-medium">novo</span>;
  const flat = Math.abs(delta.percent) < 0.5;
  const up = delta.percent > 0;
  return (
    <span className={flat ? "font-medium" : up ? "font-medium text-danger" : "font-medium text-accent"}>
      {flat ? "=" : formatPercent(delta.percent)}
    </span>
  );
}
