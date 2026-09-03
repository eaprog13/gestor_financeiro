import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  getDaysInMonth,
  getISOWeek,
  getISOWeekYear,
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
import { formatCurrency, formatMonthShort, formatShortDate } from "@/lib/format";
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
    /** Média dos anos anteriores completos — undefined sem histórico prévio (só há o ano corrente). */
    averageAllTime?: number;
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
    /** Espelho de biggestExpense — a mais pequena despesa do mês. */
    smallestExpense: { amount: number; date: Date; note: string | null; category: Category } | null;
    /** Só preenchido quando este mês está visivelmente abaixo da média (ver LIMIAR_POUPANCA) — não é "sempre mostrar a diferença", é "assinalar quando vale a pena". */
    savingsMonth: { amount: number; percent: number } | null;
  };
};

export type InsightTone = "positive" | "warning" | "neutral";

export type Insight = {
  id: string;
  tone: InsightTone;
  text: string;
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
  // Média dos anos anteriores COMPLETOS — o ano corrente fica de fora por
  // estar sempre a meio (mesmo padrão de average8w/average12m acima).
  const priorYears = [...yearsWithData].filter((year) => year !== now.getFullYear());
  const averageAllTimeYears =
    priorYears.length > 0
      ? priorYears.reduce((sum, year) => sum + sumInRange(expenses, new Date(year, 0, 1), new Date(year + 1, 0, 1)), 0) /
        priorYears.length
      : undefined;

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

  const smallestExpenseRaw = monthExpenses.reduce<RawExpense | null>(
    (min, expense) => (!min || expense.amount < min.amount ? expense : min),
    null,
  );
  const smallestExpense = smallestExpenseRaw
    ? {
        amount: smallestExpenseRaw.amount,
        date: smallestExpenseRaw.date,
        note: smallestExpenseRaw.note,
        category: categoryById.get(smallestExpenseRaw.categoryId)!,
      }
    : null;

  // "Mês em poupança": só assinala quando a diferença é grande o suficiente
  // para ser um sinal, não ruído — mês a mês varia sempre um pouco.
  const LIMIAR_POUPANCA = 10; // pontos percentuais abaixo da média
  const savingsPercent = average12m > 0 ? ((average12m - thisMonth) / average12m) * 100 : 0;
  const savingsMonth =
    average12m > 0 && savingsPercent >= LIMIAR_POUPANCA
      ? { amount: average12m - thisMonth, percent: savingsPercent }
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
      averageAllTime: averageAllTimeYears,
      series: annualSeries,
    },
    yearOverYear: {
      currentYearLabel: String(currentYear),
      previousYearLabel: String(previousYear),
      series: yearOverYearSeries,
    },
    highlights: { topCategory, biggestExpense, smallestExpense, savingsMonth },
  };
}

// ── Conclusões ───────────────────────────────────────────────────────────
// Traduz os números já calculados acima em frases concretas — o objetivo não
// é repetir um KPI ("este mês: 400€"), é apontar o PORQUÊ ou o E AGORA
// ("ao ritmo atual vais fechar 20% acima da média"). Pura função de
// MetricsData → Insight[]: nada aqui volta a olhar para despesas em bruto,
// só combina o que computeMetrics já produziu.

const LIMIAR_PROJECAO = 15; // % de desvio vs. média para valer a pena avisar
const LIMIAR_QUOTA_CATEGORIA = 40; // % do mês numa só categoria
const LIMIAR_MOVER = 25; // % de subida/descida vs. mês passado

export function computeInsights(metrics: MetricsData): Insight[] {
  const candidatos: (Insight & { magnitude: number })[] = [];
  const { monthly, annual, highlights } = metrics;

  if (monthly.average12m > 0) {
    const desvio = ((monthly.projected - monthly.average12m) / monthly.average12m) * 100;
    if (desvio >= LIMIAR_PROJECAO) {
      candidatos.push({
        id: "projecao-alta",
        tone: "warning",
        magnitude: desvio,
        text: `Ao ritmo atual, vais fechar o mês em ${formatCurrency(monthly.projected)} — ${formatPercentAbs(desvio)} acima da tua média dos últimos 12 meses.`,
      });
    } else if (desvio <= -LIMIAR_PROJECAO) {
      candidatos.push({
        id: "projecao-baixa",
        tone: "positive",
        magnitude: Math.abs(desvio),
        text: `Ao ritmo atual, vais fechar o mês em ${formatCurrency(monthly.projected)} — ${formatPercentAbs(Math.abs(desvio))} abaixo da tua média dos últimos 12 meses.`,
      });
    }
  }

  if (highlights.topCategory && highlights.topCategory.share >= LIMIAR_QUOTA_CATEGORIA) {
    candidatos.push({
      id: "quota-categoria",
      tone: "neutral",
      magnitude: highlights.topCategory.share,
      text: `"${highlights.topCategory.category.name}" já representa ${highlights.topCategory.share.toFixed(0)}% dos gastos deste mês — a maior fatia, de longe.`,
    });
  }

  const maiorSubida = monthly.movers[0];
  if (maiorSubida && maiorSubida.diff > 0 && maiorSubida.percent !== null && maiorSubida.percent >= LIMIAR_MOVER) {
    candidatos.push({
      id: "maior-subida",
      tone: "warning",
      magnitude: maiorSubida.percent,
      text: `"${maiorSubida.category.name}" subiu ${formatPercentAbs(maiorSubida.percent)} face ao mês passado (+${formatCurrency(maiorSubida.diff)}).`,
    });
  }

  const maiorDescida = [...monthly.movers].sort((a, b) => a.diff - b.diff)[0];
  if (
    maiorDescida &&
    maiorDescida.diff < 0 &&
    maiorDescida.percent !== null &&
    maiorDescida.percent <= -LIMIAR_MOVER
  ) {
    candidatos.push({
      id: "maior-descida",
      tone: "positive",
      magnitude: Math.abs(maiorDescida.percent),
      text: `Reduziste "${maiorDescida.category.name}" em ${formatPercentAbs(Math.abs(maiorDescida.percent))} face ao mês passado (${formatCurrency(maiorDescida.diff)}) — bom trabalho.`,
    });
  }

  if (highlights.savingsMonth) {
    candidatos.push({
      id: "mes-poupanca",
      tone: "positive",
      magnitude: highlights.savingsMonth.percent,
      text: `Este mês está ${formatPercentAbs(highlights.savingsMonth.percent)} abaixo da tua média habitual — uma poupança de ${formatCurrency(highlights.savingsMonth.amount)}.`,
    });
  }

  if (annual.averageAllTime !== undefined && annual.averageAllTime > 0) {
    const desvioAnual = ((annual.thisYear - annual.averageAllTime) / annual.averageAllTime) * 100;
    if (Math.abs(desvioAnual) >= LIMIAR_PROJECAO) {
      candidatos.push({
        id: "ano-vs-media",
        tone: desvioAnual > 0 ? "warning" : "positive",
        magnitude: Math.abs(desvioAnual),
        text: `Este ano já vais em ${formatCurrency(annual.thisYear)} — ${formatPercentAbs(Math.abs(desvioAnual))} ${desvioAnual > 0 ? "acima" : "abaixo"} da tua média anual.`,
      });
    }
  }

  return candidatos
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 4)
    .map((candidato) => ({ id: candidato.id, tone: candidato.tone, text: candidato.text }));
}

function formatPercentAbs(value: number) {
  return `${Math.abs(value).toFixed(0)}%`;
}

// ── Jogo de cores: "esta despesa é grande?" ─────────────────────────────
// Separado de computeMetrics porque responde a uma pergunta diferente: não
// é um KPI agregado do mês corrente, é uma classificação POR DESPESA (usada
// em qualquer listagem — hoje, histórico de anos anteriores, etc.) que
// compara cada valor ao maior valor do seu próprio dia/semana/mês/ano de
// calendário. Como dia ⊆ semana ⊆ mês ⊆ ano, o maior valor de cada janela
// cresce (nunca desce) à medida que a janela alarga — por isso basta
// verificar da maior janela para a mais pequena e devolver a primeira que
// bater certo.

export type ExpenseTier =
  | "record-year"
  | "record-month"
  | "record-week"
  | "record-day"
  | "near-record-month"
  | "normal";

export type MagnitudeRefs = {
  byDay: Map<string, number>;
  byWeek: Map<string, number>;
  byMonth: Map<string, number>;
  byYear: Map<string, number>;
  /** Piso mínimo para uma despesa sequer entrar no "jogo de cores": evita destacar a
   * única despesa (banal) de um dia sem mais nenhuma para comparar. */
  threshold: number;
};

function dayKey(date: Date) {
  return startOfDay(date).getTime().toString();
}

function weekKey(date: Date) {
  return `${getISOWeekYear(date)}-W${getISOWeek(date)}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function yearKey(date: Date) {
  return String(date.getFullYear());
}

function maiorPorChave(expenses: RawExpense[], chave: (date: Date) => string) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = chave(expense.date);
    if (expense.amount > (totals.get(key) ?? 0)) totals.set(key, expense.amount);
  }
  return totals;
}

function mediana(valores: number[]) {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Multiplicador sobre a mediana geral a partir do qual uma despesa é "grande" o
 * suficiente para entrar no jogo de cores — mesmo sendo, tecnicamente, o maior
 * valor do seu dia. */
const MULTIPLICADOR_DESPESA_GRANDE = 1.5;

export function calcularReferenciasMagnitude(expenses: RawExpense[]): MagnitudeRefs {
  return {
    byDay: maiorPorChave(expenses, dayKey),
    byWeek: maiorPorChave(expenses, weekKey),
    byMonth: maiorPorChave(expenses, monthKey),
    byYear: maiorPorChave(expenses, yearKey),
    threshold: mediana(expenses.map((expense) => expense.amount)) * MULTIPLICADOR_DESPESA_GRANDE,
  };
}

/** A partir de que fração do recorde do mês uma despesa (que não É o
 * recorde) já vale a pena assinalar como "a caminho de o ser". */
const LIMIAR_CANDIDATO_RECORDE = 0.7;

/**
 * Classifica uma despesa pelo maior nível (dia/semana/mês/ano) de que é o
 * recorde — só a partir do momento em que também é "grande" (ver
 * threshold). `refs` deve ter sido calculado a partir de uma lista que
 * inclui esta própria despesa (ver calcularReferenciasMagnitude).
 *
 * "near-record-month": não bate o recorde de nenhuma janela, mas já vai em
 * ≥70% do recorde do MÊS — um aviso mais suave de "está quase lá", pedido
 * como par do "maior do mês" (que assinala o próprio recorde).
 */
export function classificarMagnitude(expense: RawExpense, refs: MagnitudeRefs): ExpenseTier {
  if (refs.threshold <= 0 || expense.amount < refs.threshold) return "normal";
  if (expense.amount >= (refs.byYear.get(yearKey(expense.date)) ?? 0)) return "record-year";
  if (expense.amount >= (refs.byMonth.get(monthKey(expense.date)) ?? 0)) return "record-month";
  if (expense.amount >= (refs.byWeek.get(weekKey(expense.date)) ?? 0)) return "record-week";
  if (expense.amount >= (refs.byDay.get(dayKey(expense.date)) ?? 0)) return "record-day";
  const recordeMes = refs.byMonth.get(monthKey(expense.date)) ?? 0;
  if (recordeMes > 0 && expense.amount >= recordeMes * LIMIAR_CANDIDATO_RECORDE) return "near-record-month";
  return "normal";
}
