// Ports (contratos) de acesso a dados. O núcleo do negócio (core/services,
// e as páginas/actions que só usam services) depende apenas destas
// interfaces — nunca de um SDK de base de dados concreto. Para trocar de
// base de dados, escreve-se uma nova implementação em src/adapters/ e
// liga-se em src/composition/container.ts — nada mais muda.

import type { Category, Expense, ExpenseWithCategory, Profile } from "@/core/types";

export type NewCategory = {
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  order: number;
};

export interface RepositorioCategoria {
  listar(): Promise<Category[]>;
  obterPorId(id: string): Promise<Category | null>;
  obterPorNome(name: string): Promise<Category | null>;
  contar(): Promise<number>;
  criar(dados: NewCategory): Promise<Category>;
  atualizar(id: string, dados: { name: string; icon: string; color: string }): Promise<Category>;
  /** Novo "order" de cada categoria = a sua posição em "ids" (0, 1, 2, ...) — vem do arrastar no registo rápido. */
  reordenar(ids: string[]): Promise<void>;
  remover(id: string): Promise<void>;
}

export type ExpenseFilters = {
  from?: Date;
  to?: Date; // exclusivo
  categoryId?: string;
  search?: string;
};

export interface RepositorioDespesa {
  /** Sempre ordenado por data desc. Sem filtros, devolve todas — usado por src/lib/metrics.ts. */
  listar(filtros?: ExpenseFilters): Promise<ExpenseWithCategory[]>;
  recentes(limit: number): Promise<ExpenseWithCategory[]>;
  /** Quantas despesas usam esta categoria — usado para impedir apagar categorias em uso. */
  contarPorCategoria(categoryId: string): Promise<number>;
  criar(dados: { categoryId: string; amount: number; date: Date; note?: string }): Promise<Expense>;
  remover(id: string): Promise<void>;
}

export interface RepositorioPerfil {
  listar(): Promise<Profile[]>;
  obterPorId(id: string): Promise<Profile | null>;
  obterPorEmail(email: string): Promise<Profile | null>;
  atualizar(id: string, dados: { name: string }): Promise<Profile>;
  atualizarTema(id: string, theme: string): Promise<Profile>;
  atualizarColorScheme(id: string, colorScheme: string): Promise<Profile>;
  atualizarCategoryView(id: string, categoryView: string): Promise<Profile>;
}
