import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepositorioDespesa, ExpenseFilters } from "@/core/ports/repositories";
import type { Expense, ExpenseWithCategory } from "@/core/types";
import { paraCategoria, type LinhaCategoria } from "@/adapters/supabase/categoryRow";

type LinhaDespesa = {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  category_id: string;
  created_at: string;
};

type LinhaDespesaComCategoria = LinhaDespesa & { category: LinhaCategoria };

function paraDespesa(linha: LinhaDespesa): Expense {
  return {
    id: linha.id,
    amount: Number(linha.amount),
    note: linha.note,
    date: new Date(linha.date),
    categoryId: linha.category_id,
    createdAt: new Date(linha.created_at),
  };
}

function paraDespesaComCategoria(linha: LinhaDespesaComCategoria): ExpenseWithCategory {
  return { ...paraDespesa(linha), category: paraCategoria(linha.category) };
}

export class RepositorioDespesaSupabase implements RepositorioDespesa {
  constructor(private readonly bd: SupabaseClient) {}

  async listar(filtros: ExpenseFilters = {}): Promise<ExpenseWithCategory[]> {
    let query = this.bd.from("expenses").select("*, category:categories(*)").order("date", { ascending: false });

    if (filtros.from) query = query.gte("date", filtros.from.toISOString());
    if (filtros.to) query = query.lt("date", filtros.to.toISOString());
    if (filtros.categoryId) query = query.eq("category_id", filtros.categoryId);
    if (filtros.search) query = query.ilike("note", `%${filtros.search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`[expenses.listar] ${error.message}`);
    return (data ?? []).map((linha) => paraDespesaComCategoria(linha as LinhaDespesaComCategoria));
  }

  async recentes(limit: number): Promise<ExpenseWithCategory[]> {
    const { data, error } = await this.bd
      .from("expenses")
      .select("*, category:categories(*)")
      .order("date", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[expenses.recentes] ${error.message}`);
    return (data ?? []).map((linha) => paraDespesaComCategoria(linha as LinhaDespesaComCategoria));
  }

  async contarPorCategoria(categoryId: string): Promise<number> {
    const { count, error } = await this.bd
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);
    if (error) throw new Error(`[expenses.contarPorCategoria] ${error.message}`);
    return count ?? 0;
  }

  async criar(dados: { categoryId: string; amount: number; date: Date; note?: string }): Promise<Expense> {
    const { data, error } = await this.bd
      .from("expenses")
      .insert({
        category_id: dados.categoryId,
        amount: dados.amount,
        date: dados.date.toISOString(),
        note: dados.note ?? null,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(`[expenses.criar] ${error?.message}`);
    return paraDespesa(data);
  }

  async remover(id: string): Promise<void> {
    const { error } = await this.bd.from("expenses").delete().eq("id", id);
    if (error) throw new Error(`[expenses.remover] ${error.message}`);
  }
}
