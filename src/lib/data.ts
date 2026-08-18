import { addMonths, startOfDay, startOfMonth, startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

export async function getDashboardData() {
  const monthStart = startOfMonth(new Date());
  const nextMonthStart = addMonths(monthStart, 1);
  const todayStart = startOfToday();

  const [categories, monthExpenses, todayAgg, recentExpenses] = await Promise.all([
    getCategories(),
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lt: nextMonthStart } },
      select: { amount: true, categoryId: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 8,
      include: { category: true },
    }),
  ]);

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = todayAgg._sum.amount ?? 0;

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
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    if (year && month) {
      const start = startOfMonth(new Date(year, month - 1, 1));
      const end = addMonths(start, 1);
      where.date = { gte: start, lt: end };
    }
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.search) {
    where.note = { contains: filters.search };
  }

  const [expenses, categories, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: true },
    }),
    getCategories(),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return { expenses, categories, total: total._sum.amount ?? 0 };
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
