import { describe, expect, it } from "vitest";
import {
  calcularReferenciasMagnitude,
  classificarMagnitude,
  computeInsights,
  computeMetrics,
  type RawExpense,
} from "@/lib/metrics";
import type { Category } from "@/core/types";

function category(over: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    name: "Supermercado",
    icon: "ShoppingCart",
    color: "#16a34a",
    isDefault: true,
    order: 0,
    createdAt: new Date("2026-01-01"),
    ...over,
  };
}

function expense(over: Partial<RawExpense>): RawExpense {
  return { id: "e", amount: 10, date: new Date("2026-08-15T12:00:00"), categoryId: "cat-1", note: null, ...over };
}

const now = new Date("2026-08-15T18:00:00"); // sábado

describe("computeMetrics", () => {
  it("soma as despesas de hoje e calcula a variação vs. ontem", () => {
    const categories = [category()];
    const expenses = [
      expense({ id: "1", date: new Date("2026-08-15T09:00:00"), amount: 20 }),
      expense({ id: "2", date: new Date("2026-08-14T09:00:00"), amount: 10 }),
    ];

    const metrics = computeMetrics(expenses, categories, now);

    expect(metrics.daily.today).toBe(20);
    // (20 - 10) / 10 = +100%
    expect(metrics.daily.vsYesterday.percent).toBe(100);
  });

  it("vsYesterday.percent é null quando não há baseline (ontem = 0) e hoje > 0", () => {
    const categories = [category()];
    const expenses = [expense({ id: "1", date: new Date("2026-08-15T09:00:00"), amount: 20 })];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.daily.vsYesterday.percent).toBeNull();
  });

  it("ignora despesas fora do intervalo pedido (não gasta no mês seguinte)", () => {
    const categories = [category()];
    const expenses = [expense({ id: "1", date: new Date("2026-09-01T09:00:00"), amount: 999 })];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.monthly.thisMonth).toBe(0);
  });

  it("identifica a categoria com maior gasto do mês (topCategory) e a sua quota", () => {
    const categories = [category({ id: "cat-1", name: "Supermercado" }), category({ id: "cat-2", name: "Lazer" })];
    const expenses = [
      expense({ id: "1", categoryId: "cat-1", amount: 80, date: new Date("2026-08-05") }),
      expense({ id: "2", categoryId: "cat-2", amount: 20, date: new Date("2026-08-06") }),
    ];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.highlights.topCategory?.category.id).toBe("cat-1");
    expect(metrics.highlights.topCategory?.share).toBeCloseTo(80);
  });

  it("movers só inclui categorias com movimento este mês ou no anterior", () => {
    const categories = [category({ id: "cat-1" }), category({ id: "cat-2", name: "Sem movimento" })];
    const expenses = [expense({ id: "1", categoryId: "cat-1", amount: 50, date: new Date("2026-08-05") })];

    const metrics = computeMetrics(expenses, categories, now);
    const ids = metrics.monthly.movers.map((m) => m.category.id);
    expect(ids).toContain("cat-1");
    expect(ids).not.toContain("cat-2");
  });

  it("annual.averageAllTime é a média dos anos ANTERIORES completos, excluindo o corrente", () => {
    const categories = [category()];
    const expenses = [
      expense({ id: "1", date: new Date("2024-06-01"), amount: 100 }),
      expense({ id: "2", date: new Date("2025-06-01"), amount: 300 }),
      expense({ id: "3", date: new Date("2026-06-01"), amount: 999 }), // ano corrente, fica de fora
    ];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.annual.averageAllTime).toBe(200); // (100 + 300) / 2
  });

  it("annual.averageAllTime é undefined sem nenhum ano anterior", () => {
    const categories = [category()];
    const expenses = [expense({ id: "1", date: new Date("2026-06-01"), amount: 100 })];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.annual.averageAllTime).toBeUndefined();
  });

  it("identifica a menor despesa do mês (smallestExpense)", () => {
    const categories = [category()];
    const expenses = [
      expense({ id: "1", amount: 80, date: new Date("2026-08-05") }),
      expense({ id: "2", amount: 5, date: new Date("2026-08-06") }),
    ];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.highlights.smallestExpense?.amount).toBe(5);
  });

  it("savingsMonth só fica preenchido quando o mês está ≥10% abaixo da média de 12 meses", () => {
    const categories = [category()];
    // 11 meses anteriores completos a 100€/mês (média = 100), mês corrente a 50€ (50% abaixo).
    const mesesAnteriores = Array.from({ length: 11 }, (_, i) =>
      expense({ id: `prev-${i}`, amount: 100, date: new Date(2026, 6 - i, 10) }),
    );
    const expenses = [...mesesAnteriores, expense({ id: "atual", amount: 50, date: new Date("2026-08-10") })];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.highlights.savingsMonth).not.toBeNull();
    expect(metrics.highlights.savingsMonth?.percent).toBeCloseTo(50);
  });

  it("savingsMonth fica null quando a diferença face à média é pequena", () => {
    const categories = [category()];
    const mesesAnteriores = Array.from({ length: 11 }, (_, i) =>
      expense({ id: `prev-${i}`, amount: 100, date: new Date(2026, 6 - i, 10) }),
    );
    const expenses = [...mesesAnteriores, expense({ id: "atual", amount: 98, date: new Date("2026-08-10") })];

    const metrics = computeMetrics(expenses, categories, now);
    expect(metrics.highlights.savingsMonth).toBeNull();
  });
});

describe("classificarMagnitude", () => {
  // Mesmo conjunto de despesas para todos os testes deste bloco:
  // três pequenas (10€, mediana geral baixa) e três "grandes" espalhadas
  // por dia/mês/ano diferentes, escalando em valor: 200 < 500 < 700.
  const pequenas = [
    expense({ id: "p1", amount: 10, date: new Date("2026-01-05T09:00:00") }),
    expense({ id: "p2", amount: 10, date: new Date("2026-01-06T09:00:00") }),
    expense({ id: "p3", amount: 10, date: new Date("2026-01-07T09:00:00") }),
  ];
  // e4 e e5: mesma semana ISO (terça e quarta-feira), mesmo mês (fevereiro).
  const e4 = expense({ id: "e4", amount: 200, date: new Date("2026-02-10T09:00:00") });
  const e5 = expense({ id: "e5", amount: 500, date: new Date("2026-02-11T09:00:00") });
  const e6 = expense({ id: "e6", amount: 700, date: new Date("2026-11-01T09:00:00") });
  const todas = [...pequenas, e4, e5, e6];

  it("fica 'normal' quando o valor não chega a ser 'grande' (abaixo de 1.5x a mediana geral)", () => {
    const refs = calcularReferenciasMagnitude(todas);
    expect(classificarMagnitude(pequenas[0]!, refs)).toBe("normal");
  });

  it("'record-day': é o maior do seu dia, mas não da sua semana/mês (há um maior mais tarde na mesma semana)", () => {
    const refs = calcularReferenciasMagnitude(todas);
    expect(classificarMagnitude(e4, refs)).toBe("record-day");
  });

  it("'record-month': é o maior do seu mês (o que também implica ser o maior da sua semana), mas não do ano", () => {
    const refs = calcularReferenciasMagnitude(todas);
    expect(classificarMagnitude(e5, refs)).toBe("record-month");
  });

  it("'record-year': é o maior do ano inteiro — o nível mais alto de destaque", () => {
    const refs = calcularReferenciasMagnitude(todas);
    expect(classificarMagnitude(e6, refs)).toBe("record-year");
  });

  it("sem despesas (mediana 0), nunca classifica nada como grande", () => {
    const refs = calcularReferenciasMagnitude([]);
    expect(classificarMagnitude(expense({ id: "x", amount: 999 }), refs)).toBe("normal");
  });

  it("é sensível à própria lista: a mesma despesa muda de nível consoante o resto do histórico à volta", () => {
    // e4 (200€) sozinho no seu mês (sem o e5 de 500€ a seguir) passa a ser
    // o maior do MÊS, não só do dia — confirma que a classificação depende
    // sempre do conjunto passado, não de um valor fixo.
    const refsSemE5 = calcularReferenciasMagnitude([...pequenas, e4, e6]);
    expect(classificarMagnitude(e4, refsSemE5)).toBe("record-month");
  });

  it("'near-record-month': não bate nenhum recorde, mas já vai em ≥70% do recorde do mês", () => {
    // Mesmo dia que e5 (500€, o recorde do mês) — por isso falha logo o
    // record-day/record-week/record-month (e5 domina todos), só sobra o
    // "está perto do recorde do mês" a avaliar. 400/500 = 80% ≥ 70%.
    const e9 = expense({ id: "e9", amount: 400, date: new Date("2026-02-11T09:00:00") });
    const refs = calcularReferenciasMagnitude([...todas, e9]);
    expect(classificarMagnitude(e9, refs)).toBe("near-record-month");
  });

  it("fica 'normal' (não 'near-record-month') quando está abaixo dos 70% do recorde do mês", () => {
    // Mesmo dia que e5 outra vez, mas só 300/500 = 60% — não chega ao limiar.
    const e10 = expense({ id: "e10", amount: 300, date: new Date("2026-02-11T09:00:00") });
    const refs = calcularReferenciasMagnitude([...todas, e10]);
    expect(classificarMagnitude(e10, refs)).toBe("normal");
  });
});

describe("computeInsights", () => {
  it("sem sinais fortes o suficiente, não devolve nenhuma conclusão", () => {
    // 3 categorias com quota equilibrada (nenhuma passa dos 40%) e sem
    // histórico de meses/anos anteriores para haver desvios a assinalar.
    const categories = [
      category({ id: "cat-1", name: "Casa" }),
      category({ id: "cat-2", name: "Lazer" }),
      category({ id: "cat-3", name: "Transporte" }),
    ];
    const expenses = [
      expense({ id: "1", categoryId: "cat-1", amount: 10, date: new Date("2026-08-05") }),
      expense({ id: "2", categoryId: "cat-2", amount: 10, date: new Date("2026-08-06") }),
      expense({ id: "3", categoryId: "cat-3", amount: 10, date: new Date("2026-08-07") }),
    ];
    const metrics = computeMetrics(expenses, categories, now);
    expect(computeInsights(metrics)).toEqual([]);
  });

  it("assinala projeção acima da média quando o ritmo do mês foge muito do habitual", () => {
    const categories = [category()];
    // 11 meses anteriores a 100€, mês corrente já em 200€ a meio do mês — projeção dispara.
    const mesesAnteriores = Array.from({ length: 11 }, (_, i) =>
      expense({ id: `prev-${i}`, amount: 100, date: new Date(2026, 6 - i, 10) }),
    );
    const expenses = [...mesesAnteriores, expense({ id: "atual", amount: 200, date: new Date("2026-08-05") })];

    const metrics = computeMetrics(expenses, categories, now);
    const insights = computeInsights(metrics);
    expect(insights.some((insight) => insight.id === "projecao-alta" && insight.tone === "warning")).toBe(true);
  });

  it("assinala uma categoria com quota muito acima de 40% do mês", () => {
    const categories = [category({ id: "cat-1" }), category({ id: "cat-2", name: "Lazer" })];
    const expenses = [
      expense({ id: "1", categoryId: "cat-1", amount: 90, date: new Date("2026-08-05") }),
      expense({ id: "2", categoryId: "cat-2", amount: 10, date: new Date("2026-08-06") }),
    ];

    const metrics = computeMetrics(expenses, categories, now);
    const insights = computeInsights(metrics);
    expect(insights.some((insight) => insight.id === "quota-categoria" && insight.tone === "neutral")).toBe(true);
  });

  it("devolve no máximo 4 conclusões, ordenadas pela magnitude do sinal", () => {
    const categories = [
      category({ id: "cat-1", name: "Casa" }),
      category({ id: "cat-2", name: "Lazer" }),
      category({ id: "cat-3", name: "Transporte" }),
    ];
    const mesAnterior = [
      expense({ id: "a1", categoryId: "cat-1", amount: 100, date: new Date("2026-07-05") }),
      expense({ id: "a2", categoryId: "cat-2", amount: 100, date: new Date("2026-07-06") }),
    ];
    const mesesAnteriores = Array.from({ length: 10 }, (_, i) =>
      expense({ id: `prev-${i}`, amount: 100, date: new Date(2026, 5 - i, 10) }),
    );
    const mesAtual = [
      expense({ id: "b1", categoryId: "cat-1", amount: 500, date: new Date("2026-08-05") }), // sobe muito
      expense({ id: "b2", categoryId: "cat-2", amount: 5, date: new Date("2026-08-06") }), // desce muito
    ];

    const metrics = computeMetrics([...mesAnterior, ...mesesAnteriores, ...mesAtual], categories, now);
    const insights = computeInsights(metrics);
    expect(insights.length).toBeLessThanOrEqual(4);
    expect(insights.length).toBeGreaterThan(0);
  });
});
