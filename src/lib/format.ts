const currencyFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

const dayFormatter = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

/** "segunda-feira, 17 de agosto" style heading used to group history rows. */
export function formatDayHeading(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const label = dayFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** yyyy-MM-dd, for <input type="date"> defaults. */
export function toDateInputValue(value: Date = new Date()) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

const monthFormatter = new Intl.DateTimeFormat("pt-PT", {
  month: "long",
  year: "numeric",
});

export function formatMonthLabel(value: Date) {
  const label = monthFormatter.format(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** yyyy-MM, for <input type="month"> and query params. */
export function toMonthInputValue(value: Date = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

const monthShortFormatter = new Intl.DateTimeFormat("pt-PT", { month: "short" });

/** "Ago", "Set", ... — compact month label for chart axes. */
export function formatMonthShort(value: Date) {
  const label = monthShortFormatter.format(value).replace(/\.$/, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "4/8" — compact day/month label for chart axes. */
export function formatShortDate(value: Date) {
  return `${value.getDate()}/${value.getMonth() + 1}`;
}

/** "+12%" / "-8%" / "0%" — signed percentage for deltas between periods. */
export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}
