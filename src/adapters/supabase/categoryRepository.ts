import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepositorioCategoria, NewCategory } from "@/core/ports/repositories";
import type { Category } from "@/core/types";
import { paraCategoria } from "@/adapters/supabase/categoryRow";

export class RepositorioCategoriaSupabase implements RepositorioCategoria {
  constructor(private readonly bd: SupabaseClient) {}

  async listar(): Promise<Category[]> {
    const { data, error } = await this.bd.from("categories").select("*").order("sort_order", { ascending: true });
    if (error) throw new Error(`[categories.listar] ${error.message}`);
    return (data ?? []).map(paraCategoria);
  }

  async obterPorId(id: string): Promise<Category | null> {
    const { data, error } = await this.bd.from("categories").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`[categories.obterPorId] ${error.message}`);
    return data ? paraCategoria(data) : null;
  }

  async obterPorNome(name: string): Promise<Category | null> {
    const { data, error } = await this.bd.from("categories").select("*").eq("name", name).maybeSingle();
    if (error) throw new Error(`[categories.obterPorNome] ${error.message}`);
    return data ? paraCategoria(data) : null;
  }

  async contar(): Promise<number> {
    const { count, error } = await this.bd.from("categories").select("*", { count: "exact", head: true });
    if (error) throw new Error(`[categories.contar] ${error.message}`);
    return count ?? 0;
  }

  async criar(dados: NewCategory): Promise<Category> {
    const { data, error } = await this.bd
      .from("categories")
      .insert({
        name: dados.name,
        icon: dados.icon,
        color: dados.color,
        is_default: dados.isDefault ?? false,
        sort_order: dados.order,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(`[categories.criar] ${error?.message}`);
    return paraCategoria(data);
  }

  async remover(id: string): Promise<void> {
    const { error } = await this.bd.from("categories").delete().eq("id", id);
    if (error) throw new Error(`[categories.remover] ${error.message}`);
  }
}
