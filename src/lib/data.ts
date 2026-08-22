import { addMonths, startOfDay, startOfMonth, startOfToday } from "date-fns";
import { obterContentor } from "@/composition/container";

export function getCategories() {
  return obterContentor().categorias.listar();
}

export async function getDashboardData() {
  const dependencias = obterContentor();
  const monthStart = startOfMonth(new Date());
  const nextMonthStart = addMonths(monthStart, 1);
  const todayStart = startOfToday();

  const [categories, monthExpenses, recentExpenses] = await Promise.all([
    getCategories(),
    dependencias.despesas.listar({ from: monthStart, to: nextMonthStart }),
    dependencias.despesas.recentes(8),
  ]);

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = monthExpenses
    .filter((e) => e.date >= todayStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalsByCategory = new Map<string, number>();
  for (const expense of monthExpenses) {
    totalsByCategory.set(
      expense.categoryId,
      (totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount,
    );
  }

  const breakdown = categories
    .map((category) => ({
      category,
      total: totalsByCategory.get(category.id) ?? 0,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    categories,
    monthTotal,
    todayTotal,
    monthCount: monthExpenses.length,
    breakdown,
    recentExpenses,
  };
}

export type HistoryFilters = {
  month?: string; // yyyy-MM
  categoryId?: string;
  search?: string;
};

export async function getHistory(filters: HistoryFilters) {
  const dependencias = obterContentor();
  const dbFilters: { from?: Date; to?: Date; categoryId?: string; search?: string } = {};

  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    if (year && month) {
      dbFilters.from = startOfMonth(new Date(year, month - 1, 1));
      dbFilters.to = addMonths(dbFilters.from, 1);
    }
  }
  if (filters.categoryId) dbFilters.categoryId = filters.categoryId;
  if (filters.search) dbFilters.search = filters.search;

  const [expenses, categories] = await Promise.all([
    dependencias.despesas.listar(dbFilters),
    getCategories(),
  ]);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return { expenses, categories, total };
}

export async function getUsers() {
  return obterContentor().perfis.listar();
}

/** Groups already-sorted (desc) expenses by calendar day, preserving order. */
export function groupByDay<T extends { date: Date }>(expenses: T[]) {
  const groups: { day: Date; items: T[] }[] = [];
  for (const expense of expenses) {
    const day = startOfDay(expense.date);
    const last = groups.at(-1);
    if (last && last.day.getTime() === day.getTime()) {
      last.items.push(expense);
    } else {
      groups.push({ day, items: [expense] });
    }
  }
  return groups;
}
