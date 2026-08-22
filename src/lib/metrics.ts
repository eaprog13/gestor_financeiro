import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  getDaysInMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { obterContentor } from "@/composition/container";
import { getCategories } from "@/lib/data";
import { formatMonthShort, formatShortDate } from "@/lib/format";
import type { Category } from "@/core/types";

export type RawExpense = { id: string; amount: number; date: Date; categoryId: string; note: string | null };

function sumInRange(expenses: RawExpense[], start: Date, end: Date) {
  let total = 0;
  for (const expense of expenses) {
    if (expense.date >= start && expense.date < end) total += expense.amount;
  }
  return total;
}

function sumByCategoryInRange(expenses: RawExpense[], start: Date, end: Date) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.date >= start && expense.date < end) {
      totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount);
    }
  }
  return totals;
}

export type Delta = {
  /** Percentage change vs. the comparison period; null when there's no baseline (previous period was zero). */
  percent: number | null;
};

function delta(current: number, previous: number): Delta {
  if (previous === 0) return { percent: current === 0 ? 0 : null };
  return { percent: ((current - previous) / previous) * 100 };
}

export type SeriesPoint = {
  label: string;
  /** Emphasized value (current period). */
  value: number;
  /** Optional muted comparison value, drawn alongside `value` (e.g. same month, previous year). */
  value2?: number;
};

export type Mover = {
  category: Category;
  current: number;
  previous: number;
  diff: number;
  percent: number | null;
};

export type MetricsData = {
  daily: {
    today: number;
    vsYesterday: Delta;
    average30d: number;
    vsAverage30d: Delta;
    series: SeriesPoint[];
  };
  weekly: {
    thisWeek: number;
    vsLastWeek: Delta;
    average8w: number;
    series: SeriesPoint[];
  };
  monthly: {
    thisMonth: number;
    vsLastMonth: Delta;
    projected: number;
    average12m: number;
    series: SeriesPoint[];
    movers: Mover[];
  };
  annual: {
    thisYear: number;
    vsLastYear: Delta;
    series: SeriesPoint[];
  };
  yearOverYear: {
    currentYearLabel: string;
    previousYearLabel: string;
    series: SeriesPoint[];
  };
  highlights: {
    topCategory: { category: Category; total: number; share: number } | null;
    biggestExpense: { amount: number; date: Date; note: string | null; category: Category } | null;
  };
};

export async function getMetricsData(): Promise<MetricsData> {
  const [expenses, categories] = await Promise.all([
    obterContentor().despesas.listar(),
    getCategories(),
  ]);
  return computeMetrics(expenses, categories);
}

/**
 * Cálculo puro — sem acesso à base de dados — a partir de despesas e
 * categorias já carregadas. Separado de getMetricsData() só para ser
 * testável com dados fixos (ver src/lib/metrics.test.ts), no mesmo espírito
 * de src/lib/calculations.ts no gestor_investimento.
 */
export function computeMetrics(expenses: RawExpense[], categories: Category[], now: Date = new Date()): MetricsData {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const todayStart = startOfDay(now);

  // ---- Diário ----
  const yesterdayStart = subDays(todayStart, 1);
  const today = sumInRange(expenses, todayStart, addDays(todayStart, 1));
  const yesterday = sumInRange(expenses, yesterdayStart, todayStart);
  const average30d = sumInRange(expenses, subDays(todayStart, 29), addDays(todayStart, 1)) / 30;
  const dailySeries: SeriesPoint[] = eachDayOfInterval({
    start: subDays(todayStart, 13),
    end: todayStart,
  }).map((day) => ({
    label: String(day.getDate()),
    value: sumInRange(expenses, day, addDays(day, 1)),
  }));

  // ---- Semanal ----
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);
  const thisWeek = sumInRange(expenses, weekStart, addWeeks(weekStart, 1));
  const lastWeek = sumInRange(expenses, lastWeekStart, weekStart);
  const weeklySeries: SeriesPoint[] = Array.from({ length: 8 }, (_, i) => subWeeks(weekStart, 7 - i)).map(
    (start) => ({
      label: formatShortDate(start),
      value: sumInRange(expenses, start, addWeeks(start, 1)),
    }),
  );
  // Average over the 7 completed weeks — excludes the current (still in progress) week.
  const average8w = weeklySeries.slice(0, 7).reduce((sum, point) => sum + point.value, 0) / 7;

  // ---- Mensal ----
  const monthStart = startOfMonth(now);
  const lastMonthStart = subMonths(monthStart, 1);
  const thisMonth = sumInRange(expenses, monthStart, addMonths(monthStart, 1));
  const lastMonth = sumInRange(expenses, lastMonthStart, monthStart);
  const daysElapsed = differenceInCalendarDays(todayStart, monthStart) + 1;
  const projected = daysElapsed > 0 ? (thisMonth / daysElapsed) * getDaysInMonth(now) : thisMonth;
  const monthlySeries: SeriesPoint[] = eachMonthOfInterval({
    start: subMonths(monthStart, 11),
    end: monthStart,
  }).map((start) => ({
    label: formatMonthShort(start),
    value: sumInRange(expenses, start, addMonths(start, 1)),
  }));
  // Average over the 11 completed months — excludes the current (still in progress) month.
  const average12m = monthlySeries.slice(0, 11).reduce((sum, point) => sum + point.value, 0) / 11;

  const catThisMonth = sumByCategoryInRange(expenses, monthStart, addMonths(monthStart, 1));
  const catLastMonth = sumByCategoryInRange(expenses, lastMonthStart, monthStart);
  const movers: Mover[] = categories
    .map((category) => {
      const current = catThisMonth.get(category.id) ?? 0;
      const previous = catLastMonth.get(category.id) ?? 0;
      return { category, current, previous, diff: current - previous, percent: delta(current, previous).percent };
    })
    .filter((mover) => mover.current > 0 || mover.previous > 0)
    .sort((a, b) => b.diff - a.diff);

  // ---- Anual ----
  const yearStart = startOfYear(now);
  const lastYearStart = subYears(yearStart, 1);
  const thisYear = sumInRange(expenses, yearStart, addYears(yearStart, 1));
  const lastYear = sumInRange(expenses, lastYearStart, yearStart);
  const yearsWithData = new Set(expenses.map((expense) => expense.date.getFullYear()));
  yearsWithData.add(now.getFullYear());
  const annualSeries: SeriesPoint[] = [...yearsWithData].sort().map((year) => ({
    label: String(year),
    value: sumInRange(expenses, new Date(year, 0, 1), new Date(year + 1, 0, 1)),
  }));

  // ---- Ano a ano (mês a mês) ----
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const currentMonthIndex = now.getMonth();
  const yearOverYearSeries: SeriesPoint[] = Array.from({ length: 12 }, (_, month) => ({
    label: formatMonthShort(new Date(2000, month, 1)),
    value:
      month <= currentMonthIndex
        ? sumInRange(expenses, new Date(currentYear, month, 1), new Date(currentYear, month + 1, 1))
        : 0,
    value2: sumInRange(expenses, new Date(previousYear, month, 1), new Date(previousYear, month + 1, 1)),
  }));

  // ---- Destaques ----
  const monthExpenses = expenses.filter((expense) => expense.date >= monthStart && expense.date < addMonths(monthStart, 1));
  const topCategoryEntry = [...catThisMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry
    ? {
        category: categoryById.get(topCategoryEntry[0])!,
        total: topCategoryEntry[1],
        share: thisMonth > 0 ? (topCategoryEntry[1] / thisMonth) * 100 : 0,
      }
    : null;

  const biggestExpenseRaw = monthExpenses.reduce<RawExpense | null>(
    (max, expense) => (!max || expense.amount > max.amount ? expense : max),
    null,
  );
  const biggestExpense = biggestExpenseRaw
    ? {
        amount: biggestExpenseRaw.amount,
        date: biggestExpenseRaw.date,
        note: biggestExpenseRaw.note,
        category: categoryById.get(biggestExpenseRaw.categoryId)!,
      }
    : null;

  return {
    daily: {
      today,
      vsYesterday: delta(today, yesterday),
      average30d,
      vsAverage30d: delta(today, average30d),
      series: dailySeries,
    },
    weekly: {
      thisWeek,
      vsLastWeek: delta(thisWeek, lastWeek),
      average8w,
      series: weeklySeries,
    },
    monthly: {
      thisMonth,
      vsLastMonth: delta(thisMonth, lastMonth),
      projected,
      average12m,
      series: monthlySeries,
      movers,
    },
    annual: {
      thisYear,
      vsLastYear: delta(thisYear, lastYear),
      series: annualSeries,
    },
    yearOverYear: {
      currentYearLabel: String(currentYear),
      previousYearLabel: String(previousYear),
      series: yearOverYearSeries,
    },
    highlights: { topCategory, biggestExpense },
  };
}
