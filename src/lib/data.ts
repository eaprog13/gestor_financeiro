import { addMonths, addYears, startOfDay, startOfMonth, startOfToday, startOfYear } from "date-fns";
import { obterContentor } from "@/composition/container";
import { calcularReferenciasMagnitude, classificarMagnitude, type ExpenseTier } from "@/lib/metrics";
import { formatMonthLabel } from "@/lib/format";

export function getCategories() {
  return obterContentor().categorias.listar();
}

/** "year" ou "yyyy-MM" -> intervalo [from, to) + rótulo, para "Despesas por
 * categoria" (ver CategoryViewPicker). Qualquer valor que não seja "year"
 * nem bata com "yyyy-MM" cai para "year" — nunca deixa a página rebentar
 * por causa de um query param manual/estragado. */
function resolveCategoryView(view: string, now: Date = new Date()) {
  const match = /^(\d{4})-(\d{2})$/.exec(view);
  if (!match) {
    const start = startOfYear(now);
    return { view: "year", from: start, to: addYears(start, 1), label: String(start.getFullYear()) };
  }
  const start = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return { view, from: start, to: addMonths(start, 1), label: formatMonthLabel(start) };
}

/** Junta a cada despesa o seu ExpenseTier (ver lib/metrics.ts) — usado por
 * qualquer listagem que passe despesas a <ExpenseRow>. As referências (maior
 * valor por dia/semana/mês/ano) vêm sempre do histórico COMPLETO, não só do
 * subconjunto a apresentar, para uma despesa de fevereiro continuar a ser
 * comparada ao resto de fevereiro mesmo que a página só mostre esse mês. */
function comMagnitude<T extends { id: string; amount: number; date: Date; categoryId: string; note: string | null }>(
  expenses: T[],
  todasAsDespesas: { amount: number; date: Date; categoryId: string; note: string | null; id: string }[],
): (T & { tier: ExpenseTier })[] {
  const refs = calcularReferenciasMagnitude(todasAsDespesas);
  return expenses.map((expense) => ({ ...expense, tier: classificarMagnitude(expense, refs) }));
}

/**
 * "view" resolve para o ano corrente por defeito ("year"), mas aceita um
 * mês concreto ("yyyy-MM") — ver CategoryViewPicker e a preferência
 * profiles.category_view. Só afeta "Despesas por categoria"; os cartões de
 * resumo (SummaryCards) continuam sempre presos ao mês corrente.
 */
export async function getDashboardData(view: string = "year") {
  const dependencias = obterContentor();
  const monthStart = startOfMonth(new Date());
  const nextMonthStart = addMonths(monthStart, 1);
  const todayStart = startOfToday();
  const { view: resolvedView, from: viewStart, to: viewEnd, label: viewLabel } = resolveCategoryView(view);

  const [categories, monthExpenses, viewExpenses, recentExpensesRaw, todasAsDespesas] = await Promise.all([
    getCategories(),
    dependencias.despesas.listar({ from: monthStart, to: nextMonthStart }),
    dependencias.despesas.listar({ from: viewStart, to: viewEnd }),
    dependencias.despesas.recentes(8),
    dependencias.despesas.listar(),
  ]);
  const recentExpenses = comMagnitude(recentExpensesRaw, todasAsDespesas);

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = monthExpenses
    .filter((e) => e.date >= todayStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalsByCategory = new Map<string, number>();
  for (const expense of viewExpenses) {
    totalsByCategory.set(
      expense.categoryId,
      (totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount,
    );
  }
  const breakdownTotal = viewExpenses.reduce((sum, e) => sum + e.amount, 0);

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
    breakdownTotal,
    breakdownLabel: viewLabel,
    view: resolvedView,
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

  const [expensesRaw, categories, todasAsDespesas] = await Promise.all([
    dependencias.despesas.listar(dbFilters),
    getCategories(),
    // Sem filtros — as referências de magnitude (maior despesa do dia/semana/
    // mês/ano) têm de vir sempre do histórico completo, mesmo quando a
    // página está filtrada a um mês ou categoria específicos.
    dependencias.despesas.listar(),
  ]);
  const expenses = comMagnitude(expensesRaw, todasAsDespesas);
  const total = expensesRaw.reduce((sum, e) => sum + e.amount, 0);

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
