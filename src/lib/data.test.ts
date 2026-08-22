import { describe, expect, it } from "vitest";
import { groupByDay } from "@/lib/data";

describe("groupByDay", () => {
  it("agrupa despesas do mesmo dia preservando a ordem", () => {
    const groups = groupByDay([
      { date: new Date("2026-08-15T09:00:00") },
      { date: new Date("2026-08-15T18:00:00") },
      { date: new Date("2026-08-14T09:00:00") },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.items).toHaveLength(2);
    expect(groups[1]!.items).toHaveLength(1);
  });

  it("não agrupa dias iguais não-consecutivos na lista (assume já ordenado)", () => {
    // groupByDay não reordena — só junta dias iguais consecutivos, tal como
    // a lista já vem ordenada por data desc da base de dados.
    const groups = groupByDay([
      { date: new Date("2026-08-15T09:00:00") },
      { date: new Date("2026-08-14T09:00:00") },
      { date: new Date("2026-08-15T18:00:00") },
    ]);
    expect(groups).toHaveLength(3);
  });
});
