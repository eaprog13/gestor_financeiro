import { getHistory, groupByDay } from "@/lib/data";
import { ExpenseRow } from "@/components/ExpenseRow";
import { formatCurrency, formatDayHeading, toMonthInputValue } from "@/lib/format";

export default async function HistoricoPage({
  searchParams,
}: PageProps<"/historico">) {
  const params = await searchParams;
  const month = typeof params.month === "string" ? params.month : toMonthInputValue();
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const search = typeof params.search === "string" ? params.search : "";

  const { expenses, categories, total } = await getHistory({
    month: month || undefined,
    categoryId: categoryId || undefined,
    search: search || undefined,
  });

  const groups = groupByDay(expenses);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Histórico</h1>
        <p className="text-sm text-foreground-muted">
          {expenses.length === 1 ? "1 despesa" : `${expenses.length} despesas`} ·{" "}
          {formatCurrency(total)}
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-surface p-3"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
          Mês
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
          Categoria
          <select
            name="categoryId"
            defaultValue={categoryId}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-32 flex-1 flex-col gap-1 text-xs font-medium text-foreground-muted">
          Pesquisar nota
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="ex: prenda"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          Filtrar
        </button>
        <a
          href="/historico"
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted"
        >
          Limpar
        </a>
      </form>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Nenhuma despesa encontrada com estes filtros.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.day.toISOString()} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {formatDayHeading(group.day)}
              </h2>
              <div className="divide-y divide-border">
                {group.items.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
