import { describe, expect, it } from "vitest";
import { computeMetrics, type RawExpense } from "@/lib/metrics";
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
});
