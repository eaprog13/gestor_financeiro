import { describe, expect, it } from "vitest";
import { criarDependenciasFalsas } from "@/core/services/testFakes";
import { criarCategoria, removerCategoria } from "@/core/services/categoryService";

describe("criarCategoria", () => {
  it("cria a categoria com order = número de categorias existentes", async () => {
    const deps = criarDependenciasFalsas();
    await criarCategoria(deps, { name: "A", icon: "ShoppingCart", color: "#16a34a" });
    const resultado = await criarCategoria(deps, { name: "B", icon: "Pill", color: "#dc2626" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.category.order).toBe(1);
  });

  it("rejeita nome duplicado", async () => {
    const deps = criarDependenciasFalsas();
    await criarCategoria(deps, { name: "Renda", icon: "Home", color: "#7c3aed" });
    const resultado = await criarCategoria(deps, { name: "Renda", icon: "Home", color: "#7c3aed" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.message).toMatch(/já existe/i);
  });
});

describe("removerCategoria", () => {
  it("recusa apagar categoria inexistente", async () => {
    const deps = criarDependenciasFalsas();
    const resultado = await removerCategoria(deps, "não-existe");
    expect(resultado).toEqual({ ok: false, message: "Categoria não encontrada." });
  });

  it("recusa apagar categoria base (isDefault)", async () => {
    const deps = criarDependenciasFalsas();
    const criada = await deps.categorias.criar({ name: "Base", icon: "Home", color: "#000000", isDefault: true, order: 0 });

    const resultado = await removerCategoria(deps, criada.id);
    expect(resultado).toEqual({ ok: false, message: "As categorias base não podem ser apagadas." });
  });

  it("recusa apagar categoria com despesas associadas", async () => {
    const deps = criarDependenciasFalsas();
    const cat = await deps.categorias.criar({ name: "Lazer", icon: "Gamepad2", color: "#000000", order: 0 });
    await deps.despesas.criar({ categoryId: cat.id, amount: 10, date: new Date() });

    const resultado = await removerCategoria(deps, cat.id);
    expect(resultado.ok).toBe(false);
  });

  it("apaga categoria sem despesas e não-base", async () => {
    const deps = criarDependenciasFalsas();
    const cat = await deps.categorias.criar({ name: "Lazer", icon: "Gamepad2", color: "#000000", order: 0 });

    const resultado = await removerCategoria(deps, cat.id);
    expect(resultado).toEqual({ ok: true });
    expect(await deps.categorias.obterPorId(cat.id)).toBeNull();
  });
});
