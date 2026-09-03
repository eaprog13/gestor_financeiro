import { subMonths } from "date-fns";
import { getDashboardData } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { obterContentor } from "@/composition/container";
import { formatMonthLabel, toMonthInputValue } from "@/lib/format";
import { QuickAddPanel } from "@/components/QuickAddPanel";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { RecentExpenses } from "@/components/RecentExpenses";

// Reads today's/this month's totals straight from the database on every
// request — always show what was just added, never a stale build-time copy.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const requestedView = typeof params.view === "string" ? params.view : undefined;

  // Sem "?view" na URL, cai para a preferência guardada em profiles.category_view
  // (ver CategoryViewPicker/updateCategoryView) — "year" por defeito para quem
  // ainda não escolheu nada.
  const session = await getSession();
  const perfil = session ? await obterContentor().perfis.obterPorId(session.sub) : null;
  const view = requestedView ?? perfil?.categoryView ?? "year";

  const {
    categories,
    monthTotal,
    todayTotal,
    monthCount,
    breakdown,
    breakdownTotal,
    breakdownLabel,
    view: resolvedView,
    recentExpenses,
  } = await getDashboardData(view);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return { value: toMonthInputValue(date), label: formatMonthLabel(date) };
  });

  return (
    <div className="flex flex-col gap-5">
      <SummaryCards monthTotal={monthTotal} todayTotal={todayTotal} monthCount={monthCount} />
      <div className="animate-entrada" style={{ animationDelay: "180ms" }}>
        <QuickAddPanel categories={categories} />
      </div>
      <div className="animate-entrada" style={{ animationDelay: "260ms" }}>
        <CategoryBreakdown
          breakdown={breakdown}
          total={breakdownTotal}
          label={breakdownLabel}
          view={resolvedView}
          monthOptions={monthOptions}
        />
      </div>
      <div className="animate-entrada" style={{ animationDelay: "340ms" }}>
        <RecentExpenses expenses={recentExpenses} />
      </div>
    </div>
  );
}
