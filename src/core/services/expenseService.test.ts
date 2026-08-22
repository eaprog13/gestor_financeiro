import { describe, expect, it } from "vitest";
import { criarDependenciasFalsas } from "@/core/services/testFakes";
import { criarDespesa, removerDespesa } from "@/core/services/expenseService";

describe("criarDespesa", () => {
  it("recusa categoria inexistente", async () => {
    const deps = criarDependenciasFalsas();
    const resultado = await criarDespesa(deps, { categoryId: "não-existe", amount: 10, date: new Date() });
    expect(resultado).toEqual({ ok: false, message: "Categoria não encontrada." });
  });

  it("cria a despesa e devolve o nome da categoria", async () => {
    const deps = criarDependenciasFalsas();
    const cat = await deps.categorias.criar({ name: "Supermercado", icon: "ShoppingCart", color: "#16a34a", order: 0 });

    const resultado = await criarDespesa(deps, { categoryId: cat.id, amount: 42.5, date: new Date() });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.categoryName).toBe("Supermercado");
      expect(resultado.expense.amount).toBe(42.5);
    }
  });
});

describe("removerDespesa", () => {
  it("remove a despesa do repositório", async () => {
    const deps = criarDependenciasFalsas();
    const cat = await deps.categorias.criar({ name: "Farmácia", icon: "Pill", color: "#dc2626", order: 0 });
    const expense = await deps.despesas.criar({ categoryId: cat.id, amount: 5, date: new Date() });

    await removerDespesa(deps, expense.id);
    expect(await deps.despesas.contarPorCategoria(cat.id)).toBe(0);
  });
});
