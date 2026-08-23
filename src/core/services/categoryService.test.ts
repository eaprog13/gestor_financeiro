import { describe, expect, it } from "vitest";
import { criarDependenciasFalsas } from "@/core/services/testFakes";
import { atualizarCategoria, criarCategoria, reordenarCategorias, removerCategoria } from "@/core/services/categoryService";

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

describe("atualizarCategoria", () => {
  it("recusa categoria inexistente", async () => {
    const deps = criarDependenciasFalsas();
    const resultado = await atualizarCategoria(deps, "não-existe", { name: "X", icon: "Home", color: "#000000" });
    expect(resultado).toEqual({ ok: false, message: "Categoria não encontrada." });
  });

  it("recusa nome duplicado de outra categoria", async () => {
    const deps = criarDependenciasFalsas();
    await criarCategoria(deps, { name: "Renda", icon: "Home", color: "#7c3aed" });
    const outra = await criarCategoria(deps, { name: "Lazer", icon: "Gamepad2", color: "#dc2626" });
    if (!outra.ok) throw new Error("setup falhou");

    const resultado = await atualizarCategoria(deps, outra.category.id, {
      name: "Renda",
      icon: "Gamepad2",
      color: "#dc2626",
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.message).toMatch(/já existe/i);
  });

  it("permite guardar sem mudar o nome (não colide consigo própria)", async () => {
    const deps = criarDependenciasFalsas();
    const criada = await criarCategoria(deps, { name: "Lazer", icon: "Gamepad2", color: "#dc2626" });
    if (!criada.ok) throw new Error("setup falhou");

    const resultado = await atualizarCategoria(deps, criada.category.id, {
      name: "Lazer",
      icon: "Gamepad2",
      color: "#000000",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.category.color).toBe("#000000");
  });

  it("atualiza nome, ícone e cor de uma categoria base (isDefault)", async () => {
    const deps = criarDependenciasFalsas();
    const base = await deps.categorias.criar({ name: "Base", icon: "Home", color: "#000000", isDefault: true, order: 0 });

    const resultado = await atualizarCategoria(deps, base.id, { name: "Base 2", icon: "Car", color: "#111111" });

    expect(resultado).toEqual({
      ok: true,
      category: { ...base, name: "Base 2", icon: "Car", color: "#111111" },
    });
  });
});

describe("reordenarCategorias", () => {
  it("aplica a nova ordem (posição em ids -> order)", async () => {
    const deps = criarDependenciasFalsas();
    const a = await criarCategoria(deps, { name: "A", icon: "Home", color: "#000000" });
    const b = await criarCategoria(deps, { name: "B", icon: "Home", color: "#000000" });
    const c = await criarCategoria(deps, { name: "C", icon: "Home", color: "#000000" });
    if (!a.ok || !b.ok || !c.ok) throw new Error("setup falhou");

    const resultado = await reordenarCategorias(deps, [c.category.id, a.category.id, b.category.id]);

    expect(resultado).toEqual({ ok: true });
    const lista = await deps.categorias.listar();
    expect(lista.map((cat) => cat.name)).toEqual(["C", "A", "B"]);
  });

  it("recusa se a lista de ids não corresponder às categorias existentes", async () => {
    const deps = criarDependenciasFalsas();
    const a = await criarCategoria(deps, { name: "A", icon: "Home", color: "#000000" });
    await criarCategoria(deps, { name: "B", icon: "Home", color: "#000000" });
    if (!a.ok) throw new Error("setup falhou");

    // Falta o id de "B" — lista dessincronizada.
    const resultado = await reordenarCategorias(deps, [a.category.id]);
    expect(resultado.ok).toBe(false);
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
