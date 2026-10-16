import { describe, expect, it } from "vitest";
import {
  atualizarCategoryView,
  atualizarColorScheme,
  atualizarTema,
  atualizarUtilizador,
} from "@/core/services/userService";
import type { Dependencias } from "@/core/deps";
import type { Profile } from "@/core/types";

function contentorFalso(perfisIniciais: Profile[] = []) {
  const perfis = [...perfisIniciais];
  const nomesAtualizadosNaIdentidade: Record<string, string> = {};

  const dependencias: Dependencias = {
    perfis: {
      listar: async () => perfis,
      obterPorId: async (id) => perfis.find((p) => p.id === id) ?? null,
      obterPorEmail: async (email) => perfis.find((p) => p.email === email) ?? null,
      atualizar: async (id, dados) => {
        const perfil = perfis.find((p) => p.id === id);
        if (!perfil) throw new Error("Perfil não encontrado.");
        perfil.name = dados.name;
        return perfil;
      },
      atualizarTema: async (id, theme) => {
        const perfil = perfis.find((p) => p.id === id);
        if (!perfil) throw new Error("Perfil não encontrado.");
        perfil.theme = theme;
        return perfil;
      },
      atualizarColorScheme: async (id, colorScheme) => {
        const perfil = perfis.find((p) => p.id === id);
        if (!perfil) throw new Error("Perfil não encontrado.");
        perfil.colorScheme = colorScheme;
        return perfil;
      },
      atualizarCategoryView: async (id, categoryView) => {
        const perfil = perfis.find((p) => p.id === id);
        if (!perfil) throw new Error("Perfil não encontrado.");
        perfil.categoryView = categoryView;
        return perfil;
      },
    },
    identidade: {
      atualizarNome: async (id, name) => {
        nomesAtualizadosNaIdentidade[id] = name;
      },
    },
    // Não usados por atualizarUtilizador — só para
    // satisfazer o tipo Dependencias.
    categorias: {} as Dependencias["categorias"],
    despesas: {} as Dependencias["despesas"],
  };

  return { dependencias, nomesAtualizadosNaIdentidade };
}

describe("atualizarUtilizador", () => {
  it("atualiza o nome em profiles e em user_metadata (identidade)", async () => {
    const existente: Profile = {
      id: "id-1",
      email: "ana@x.com",
      name: "Ana",
      theme: "green",
      colorScheme: "system",
      categoryView: "year",
      createdAt: new Date(),
    };
    const { dependencias, nomesAtualizadosNaIdentidade } = contentorFalso([existente]);

    const perfil = await atualizarUtilizador(dependencias, "id-1", { name: "Ana Maria" });
    expect(perfil.name).toBe("Ana Maria");
    expect(nomesAtualizadosNaIdentidade["id-1"]).toBe("Ana Maria");
  });
});

describe("atualizarTema", () => {
  it("atualiza só o tema, sem tocar no resto do perfil", async () => {
    const existente: Profile = {
      id: "id-1",
      email: "ana@x.com",
      name: "Ana",
      theme: "green",
      colorScheme: "system",
      categoryView: "year",
      createdAt: new Date(),
    };
    const { dependencias } = contentorFalso([existente]);

    const perfil = await atualizarTema(dependencias, "id-1", "blue");
    expect(perfil.theme).toBe("blue");
    expect(perfil.name).toBe("Ana");
  });
});

describe("atualizarColorScheme", () => {
  it("atualiza só o modo de cor, sem tocar no resto do perfil", async () => {
    const existente: Profile = {
      id: "id-1",
      email: "ana@x.com",
      name: "Ana",
      theme: "green",
      colorScheme: "system",
      categoryView: "year",
      createdAt: new Date(),
    };
    const { dependencias } = contentorFalso([existente]);

    const perfil = await atualizarColorScheme(dependencias, "id-1", "dark");
    expect(perfil.colorScheme).toBe("dark");
    expect(perfil.theme).toBe("green");
  });
});

describe("atualizarCategoryView", () => {
  it("atualiza só a vista de categorias, sem tocar no resto do perfil", async () => {
    const existente: Profile = {
      id: "id-1",
      email: "ana@x.com",
      name: "Ana",
      theme: "green",
      colorScheme: "system",
      categoryView: "year",
      createdAt: new Date(),
    };
    const { dependencias } = contentorFalso([existente]);

    const perfil = await atualizarCategoryView(dependencias, "id-1", "2026-08");
    expect(perfil.categoryView).toBe("2026-08");
    expect(perfil.theme).toBe("green");
  });
});
