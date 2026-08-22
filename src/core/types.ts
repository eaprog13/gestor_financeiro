// Tipos de domínio. Independentes de Prisma/Supabase — os adapters é que
// convertem as linhas da base de dados (snake_case) para estas formas.

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
};

export type Expense = {
  id: string;
  amount: number;
  note: string | null;
  date: Date;
  categoryId: string;
  createdAt: Date;
};

export type ExpenseWithCategory = Expense & { category: Category };

export type Profile = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};
