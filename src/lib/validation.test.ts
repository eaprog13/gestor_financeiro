import { describe, expect, it } from "vitest";
import { categorySchema, categoryViewSchema, colorSchemeSchema, expenseSchema, idSchema, loginSchema, userSchema } from "@/lib/validation";

describe("expenseSchema", () => {
  it("aceita uma despesa válida", () => {
    const result = expenseSchema.safeParse({
      categoryId: "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e",
      amount: "12.50",
      date: "2026-08-15",
      note: "  Pão e leite  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe("Pão e leite");
  });

  it("rejeita valor zero ou negativo", () => {
    expect(expenseSchema.safeParse({ categoryId: "c", amount: "0", date: "2026-08-15" }).success).toBe(false);
    expect(expenseSchema.safeParse({ categoryId: "c", amount: "-5", date: "2026-08-15" }).success).toBe(false);
  });

  it("rejeita valor acima do limite", () => {
    const result = expenseSchema.safeParse({ categoryId: "c", amount: "1000001", date: "2026-08-15" });
    expect(result.success).toBe(false);
  });

  it("rejeita sem categoria ou sem data", () => {
    expect(expenseSchema.safeParse({ categoryId: "", amount: "10", date: "2026-08-15" }).success).toBe(false);
    expect(expenseSchema.safeParse({ categoryId: "c", amount: "10", date: "" }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("aceita uma categoria válida", () => {
    const result = categorySchema.safeParse({ name: "Streaming", icon: "Film", color: "#123abc" });
    expect(result.success).toBe(true);
  });

  it("rejeita ícone desconhecido", () => {
    const result = categorySchema.safeParse({ name: "X", icon: "IconeQueNaoExiste", color: "#123abc" });
    expect(result.success).toBe(false);
  });

  it("rejeita cor fora do formato hex", () => {
    expect(categorySchema.safeParse({ name: "X", icon: "Film", color: "azul" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "X", icon: "Film", color: "#fff" }).success).toBe(false);
  });

  it("rejeita nome demasiado curto", () => {
    expect(categorySchema.safeParse({ name: "A", icon: "Film", color: "#123abc" }).success).toBe(false);
  });
});

describe("userSchema", () => {
  it("rejeita password curta", () => {
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "Curta1A" }).success).toBe(false);
  });

  it("rejeita password comprida mas sem variedade de caracteres", () => {
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "1234567890" }).success).toBe(false);
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "minusculas" }).success).toBe(false);
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "MAIUSCULAS" }).success).toBe(false);
  });

  it("aceita dados válidos", () => {
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "Password123" }).success).toBe(true);
  });
});

describe("idSchema", () => {
  it("só aceita UUIDs", () => {
    expect(idSchema.safeParse("0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e").success).toBe(true);
    expect(idSchema.safeParse("1 or 1=1").success).toBe(false);
    expect(idSchema.safeParse("").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejeita email inválido", () => {
    expect(loginSchema.safeParse({ email: "não-é-email", password: "x" }).success).toBe(false);
  });
});

describe("colorSchemeSchema", () => {
  it("aceita system/light/dark", () => {
    expect(colorSchemeSchema.safeParse({ colorScheme: "system" }).success).toBe(true);
    expect(colorSchemeSchema.safeParse({ colorScheme: "light" }).success).toBe(true);
    expect(colorSchemeSchema.safeParse({ colorScheme: "dark" }).success).toBe(true);
  });

  it("rejeita qualquer outro valor", () => {
    expect(colorSchemeSchema.safeParse({ colorScheme: "azul" }).success).toBe(false);
  });
});

describe("categoryViewSchema", () => {
  it("aceita 'year' e um mês no formato yyyy-MM", () => {
    expect(categoryViewSchema.safeParse({ view: "year" }).success).toBe(true);
    expect(categoryViewSchema.safeParse({ view: "2026-08" }).success).toBe(true);
  });

  it("rejeita formatos inválidos", () => {
    expect(categoryViewSchema.safeParse({ view: "2026" }).success).toBe(false);
    expect(categoryViewSchema.safeParse({ view: "agosto" }).success).toBe(false);
    expect(categoryViewSchema.safeParse({ view: "" }).success).toBe(false);
  });
});
