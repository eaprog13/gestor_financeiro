import { getDashboardData } from "@/lib/data";
import { QuickAddPanel } from "@/components/QuickAddPanel";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { RecentExpenses } from "@/components/RecentExpenses";

// Reads today's/this month's totals straight from the database on every
// request — always show what was just added, never a stale build-time copy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { categories, monthTotal, todayTotal, monthCount, breakdown, recentExpenses } =
    await getDashboardData();

  return (
    <div className="flex flex-col gap-5">
      <SummaryCards monthTotal={monthTotal} todayTotal={todayTotal} monthCount={monthCount} />
      <QuickAddPanel categories={categories} />
      <CategoryBreakdown breakdown={breakdown} monthTotal={monthTotal} />
      <RecentExpenses expenses={recentExpenses} />
    </div>
  );
}
