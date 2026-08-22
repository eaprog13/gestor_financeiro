import type { Category } from "@/core/types";

// Extraído de categoryRepository.ts para ser partilhado com
// expenseRepository.ts (que devolve despesas com a categoria embutida via
// "select *, category:categories(*)") sem criar um import circular entre
// os dois repositórios.

export type LinhaCategoria = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export function paraCategoria(linha: LinhaCategoria): Category {
  return {
    id: linha.id,
    name: linha.name,
    icon: linha.icon,
    color: linha.color,
    isDefault: linha.is_default,
    order: linha.sort_order,
    createdAt: new Date(linha.created_at),
  };
}
