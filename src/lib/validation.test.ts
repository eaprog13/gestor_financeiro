import { describe, expect, it } from "vitest";
import { categorySchema, expenseSchema, loginSchema, userSchema } from "@/lib/validation";

describe("expenseSchema", () => {
  it("aceita uma despesa válida", () => {
    const result = expenseSchema.safeParse({
      categoryId: "cat-1",
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
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "1234567" }).success).toBe(false);
  });

  it("aceita dados válidos", () => {
    expect(userSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "12345678" }).success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejeita email inválido", () => {
    expect(loginSchema.safeParse({ email: "não-é-email", password: "x" }).success).toBe(false);
  });
});
