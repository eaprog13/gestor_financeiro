import { describe, expect, it } from "vitest";
import { atualizarTema, criarUtilizador, atualizarUtilizador } from "@/core/services/userService";
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
    },
    identidade: {
      criarUtilizador: async (dados) => {
        const perfil: Profile = {
          id: `id-${perfis.length + 1}`,
          email: dados.email,
          name: dados.name,
          theme: "green",
          createdAt: new Date(),
        };
        perfis.push(perfil);
        return { id: perfil.id };
      },
      atualizarNome: async (id, name) => {
        nomesAtualizadosNaIdentidade[id] = name;
      },
    },
    // Não usados por criarUtilizador/atualizarUtilizador — só para
    // satisfazer o tipo Dependencias.
    categorias: {} as Dependencias["categorias"],
    despesas: {} as Dependencias["despesas"],
  };

  return { dependencias, nomesAtualizadosNaIdentidade };
}

describe("criarUtilizador", () => {
  it("cria o utilizador quando o email ainda não existe", async () => {
    const { dependencias } = contentorFalso();
    const resultado = await criarUtilizador(dependencias, { name: "Ana", email: "ana@x.com", password: "12345678" });
    expect(resultado).toEqual({ ok: true });
    expect(await dependencias.perfis.obterPorEmail("ana@x.com")).not.toBeNull();
  });

  it("recusa email já em uso, sem chamar a Admin API", async () => {
    const existente: Profile = { id: "id-1", email: "ana@x.com", name: "Ana", theme: "green", createdAt: new Date() };
    const { dependencias } = contentorFalso([existente]);

    const resultado = await criarUtilizador(dependencias, { name: "Ana 2", email: "ana@x.com", password: "12345678" });
    expect(resultado).toEqual({ ok: false, message: "Já existe um utilizador com este email." });
    expect(await dependencias.perfis.listar()).toHaveLength(1);
  });
});

describe("atualizarUtilizador", () => {
  it("atualiza o nome em profiles e em user_metadata (identidade)", async () => {
    const existente: Profile = { id: "id-1", email: "ana@x.com", name: "Ana", theme: "green", createdAt: new Date() };
    const { dependencias, nomesAtualizadosNaIdentidade } = contentorFalso([existente]);

    const perfil = await atualizarUtilizador(dependencias, "id-1", { name: "Ana Maria" });
    expect(perfil.name).toBe("Ana Maria");
    expect(nomesAtualizadosNaIdentidade["id-1"]).toBe("Ana Maria");
  });
});

describe("atualizarTema", () => {
  it("atualiza só o tema, sem tocar no resto do perfil", async () => {
    const existente: Profile = { id: "id-1", email: "ana@x.com", name: "Ana", theme: "green", createdAt: new Date() };
    const { dependencias } = contentorFalso([existente]);

    const perfil = await atualizarTema(dependencias, "id-1", "blue");
    expect(perfil.theme).toBe("blue");
    expect(perfil.name).toBe("Ana");
  });
});
