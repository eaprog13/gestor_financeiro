// Implementações em memória dos ports (src/core/ports/repositories.ts),
// usadas só nos testes dos services (categoryService.test.ts,
// expenseService.test.ts). Validam o contrato dos ports e a lógica de
// negócio sem precisar de uma ligação real ao Supabase.

import type { Dependencias } from "@/core/deps";
import type { Category, Expense, ExpenseWithCategory } from "@/core/types";
import type { ExpenseFilters, NewCategory } from "@/core/ports/repositories";

let contador = 0;
function novoId() {
  contador += 1;
  return `id-${contador}`;
}

export class RepositorioCategoriaFalso {
  categorias: Category[] = [];

  async listar() {
    return [...this.categorias].sort((a, b) => a.order - b.order);
  }
  async obterPorId(id: string) {
    return this.categorias.find((c) => c.id === id) ?? null;
  }
  async obterPorNome(name: string) {
    return this.categorias.find((c) => c.name === name) ?? null;
  }
  async contar() {
    return this.categorias.length;
  }
  async criar(dados: NewCategory): Promise<Category> {
    const category: Category = {
      id: novoId(),
      name: dados.name,
      icon: dados.icon,
      color: dados.color,
      isDefault: dados.isDefault ?? false,
      order: dados.order,
      createdAt: new Date(),
    };
    this.categorias.push(category);
    return category;
  }
  async atualizar(id: string, dados: { name: string; icon: string; color: string }): Promise<Category> {
    const category = this.categorias.find((c) => c.id === id);
    if (!category) throw new Error("categoria não encontrada");
    Object.assign(category, dados);
    return category;
  }
  async remover(id: string) {
    this.categorias = this.categorias.filter((c) => c.id !== id);
  }
}

export class RepositorioDespesaFalso {
  despesas: Expense[] = [];

  private comCategoria(despesa: Expense, categorias: Category[]): ExpenseWithCategory {
    const category = categorias.find((c) => c.id === despesa.categoryId)!;
    return { ...despesa, category };
  }

  constructor(private readonly categorias: RepositorioCategoriaFalso) {}

  async listar(filtros: ExpenseFilters = {}) {
    const todasCategorias = await this.categorias.listar();
    return this.despesas
      .filter((e) => (filtros.from ? e.date >= filtros.from : true))
      .filter((e) => (filtros.to ? e.date < filtros.to : true))
      .filter((e) => (filtros.categoryId ? e.categoryId === filtros.categoryId : true))
      .filter((e) => (filtros.search ? (e.note ?? "").includes(filtros.search) : true))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((e) => this.comCategoria(e, todasCategorias));
  }
  async recentes(limit: number) {
    return (await this.listar()).slice(0, limit);
  }
  async contarPorCategoria(categoryId: string) {
    return this.despesas.filter((e) => e.categoryId === categoryId).length;
  }
  async criar(dados: { categoryId: string; amount: number; date: Date; note?: string }): Promise<Expense> {
    const expense: Expense = {
      id: novoId(),
      amount: dados.amount,
      note: dados.note ?? null,
      date: dados.date,
      categoryId: dados.categoryId,
      createdAt: new Date(),
    };
    this.despesas.push(expense);
    return expense;
  }
  async remover(id: string) {
    this.despesas = this.despesas.filter((e) => e.id !== id);
  }
}

export function criarDependenciasFalsas(): Dependencias {
  const categorias = new RepositorioCategoriaFalso();
  const despesas = new RepositorioDespesaFalso(categorias);
  return {
    categorias,
    despesas,
    // Não usados pelos testes de categoryService/expenseService — só para
    // satisfazer o tipo Dependencias (userService tem os seus próprios
    // fakes em src/core/services/userService.test.ts).
    perfis: {} as Dependencias["perfis"],
    identidade: {} as Dependencias["identidade"],
  };
}
