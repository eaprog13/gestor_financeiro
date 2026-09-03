import { getDashboardData } from "@/lib/data";
import { QuickAddPanel } from "@/components/QuickAddPanel";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { RecentExpenses } from "@/components/RecentExpenses";

// Reads today's/this month's totals straight from the database on every
// request — always show what was just added, never a stale build-time copy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { categories, monthTotal, todayTotal, monthCount, yearTotal, year, breakdown, recentExpenses } =
    await getDashboardData();

  return (
    <div className="flex flex-col gap-5">
      <SummaryCards monthTotal={monthTotal} todayTotal={todayTotal} monthCount={monthCount} />
      <div className="animate-entrada" style={{ animationDelay: "180ms" }}>
        <QuickAddPanel categories={categories} />
      </div>
      <div className="animate-entrada" style={{ animationDelay: "260ms" }}>
        <CategoryBreakdown breakdown={breakdown} yearTotal={yearTotal} year={year} />
      </div>
      <div className="animate-entrada" style={{ animationDelay: "340ms" }}>
        <RecentExpenses expenses={recentExpenses} />
      </div>
    </div>
  );
}
