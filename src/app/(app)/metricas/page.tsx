import { Trophy, Flame, Snowflake, PiggyBank, Lightbulb } from "lucide-react";
import clsx from "clsx";
import { computeInsights, getMetricsData, type InsightTone } from "@/lib/metrics";
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
  const metrics = await getMetricsData();
  const { daily, weekly, monthly, annual, yearOverYear, highlights } = metrics;
  const insights = computeInsights(metrics);

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

      {insights.length > 0 && (
        <SectionCard title="Conclusões" description="O que os números acima dizem, em frases.">
          <ul className="flex flex-col gap-3">
            {insights.map((insight) => (
              <InsightItem key={insight.id} tone={insight.tone} text={insight.text} />
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Diário" description="Últimos 14 dias.">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>
            Hoje vs ontem: <DeltaText delta={daily.vsYesterday} />
          </span>
          <span>Média (30 dias): {formatCurrency(daily.average30d)}</span>
        </div>
        <BarChart data={daily.series} heat average={daily.average30d} />
      </SectionCard>

      <SectionCard title="Semanal" description="Últimas 8 semanas (segunda a domingo).">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>Média (7 semanas completas): {formatCurrency(weekly.average8w)}</span>
        </div>
        <BarChart data={weekly.series} heat average={weekly.average8w} />
      </SectionCard>

      <SectionCard title="Mensal" description="Últimos 12 meses.">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-muted">
          <span>Projeção fim do mês: {formatCurrency(monthly.projected)}</span>
          <span>Média (11 meses completos): {formatCurrency(monthly.average12m)}</span>
        </div>
        <BarChart data={monthly.series} heat average={monthly.average12m} />
        <div className="mt-5 border-t border-border pt-4">
          <MoversList movers={monthly.movers} />
        </div>
      </SectionCard>

      <SectionCard title="Anual" description="Total por ano civil.">
        <BarChart data={annual.series} heat average={annual.averageAllTime} />
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
            <span
              className="animate-selo flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted"
              style={{ animationDelay: "0ms" }}
            >
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
            <span
              className="animate-selo flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flag/15 text-flag"
              style={{ animationDelay: "60ms" }}
            >
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

          <div className="flex items-start gap-3">
            <span
              className="animate-selo flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
              style={{ animationDelay: "120ms" }}
            >
              <Snowflake size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground-muted">Menor despesa</p>
              {highlights.smallestExpense ? (
                <>
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    <CategoryIcon
                      icon={highlights.smallestExpense.category.icon}
                      color={highlights.smallestExpense.category.color}
                      size={12}
                    />
                    {formatCurrency(highlights.smallestExpense.amount)}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {[formatDate(highlights.smallestExpense.date), highlights.smallestExpense.note]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">Sem despesas este mês.</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span
              className="animate-selo flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
              style={{ animationDelay: "180ms" }}
            >
              <PiggyBank size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground-muted">Mês em poupança</p>
              {highlights.savingsMonth ? (
                <>
                  <p className="truncate text-sm font-semibold text-accent">
                    -{highlights.savingsMonth.percent.toFixed(0)}% vs. média
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {formatCurrency(highlights.savingsMonth.amount)} poupados este mês
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">Sem folga notável face à média este mês.</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

const INSIGHT_TONE_STYLE: Record<InsightTone, string> = {
  positive: "bg-accent/15 text-accent",
  warning: "bg-danger/15 text-danger",
  neutral: "bg-flag/15 text-flag",
};

function InsightItem({ tone, text }: { tone: InsightTone; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={clsx("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", INSIGHT_TONE_STYLE[tone])}>
        <Lightbulb size={12} />
      </span>
      <p className="text-sm leading-snug">{text}</p>
    </li>
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
