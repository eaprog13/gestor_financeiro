import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepositorioPerfil } from "@/core/ports/repositories";
import type { Profile } from "@/core/types";

type LinhaPerfil = {
  id: string;
  email: string;
  name: string;
  theme: string;
  color_scheme: string;
  category_view: string;
  created_at: string;
};

function paraPerfil(linha: LinhaPerfil): Profile {
  return {
    id: linha.id,
    email: linha.email,
    name: linha.name,
    theme: linha.theme,
    colorScheme: linha.color_scheme,
    categoryView: linha.category_view,
    createdAt: new Date(linha.created_at),
  };
}

export class RepositorioPerfilSupabase implements RepositorioPerfil {
  constructor(private readonly bd: SupabaseClient) {}

  async listar(): Promise<Profile[]> {
    const { data, error } = await this.bd.from("profiles").select("*").order("created_at", { ascending: true });
    if (error) throw new Error(`[profiles.listar] ${error.message}`);
    return (data ?? []).map(paraPerfil);
  }

  async obterPorId(id: string): Promise<Profile | null> {
    const { data, error } = await this.bd.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`[profiles.obterPorId] ${error.message}`);
    return data ? paraPerfil(data) : null;
  }

  async obterPorEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.bd.from("profiles").select("*").eq("email", email).maybeSingle();
    if (error) throw new Error(`[profiles.obterPorEmail] ${error.message}`);
    return data ? paraPerfil(data) : null;
  }

  async atualizar(id: string, dados: { name: string }): Promise<Profile> {
    const { data, error } = await this.bd
      .from("profiles")
      .update({ name: dados.name })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(`[profiles.atualizar] ${error?.message}`);
    return paraPerfil(data);
  }

  async atualizarTema(id: string, theme: string): Promise<Profile> {
    const { data, error } = await this.bd
      .from("profiles")
      .update({ theme })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(`[profiles.atualizarTema] ${error?.message}`);
    return paraPerfil(data);
  }

  async atualizarColorScheme(id: string, colorScheme: string): Promise<Profile> {
    const { data, error } = await this.bd
      .from("profiles")
      .update({ color_scheme: colorScheme })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(`[profiles.atualizarColorScheme] ${error?.message}`);
    return paraPerfil(data);
  }

  async atualizarCategoryView(id: string, categoryView: string): Promise<Profile> {
    const { data, error } = await this.bd
      .from("profiles")
      .update({ category_view: categoryView })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) throw new Error(`[profiles.atualizarCategoryView] ${error?.message}`);
    return paraPerfil(data);
  }
}
