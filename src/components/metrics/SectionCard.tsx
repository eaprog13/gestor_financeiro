import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground-muted">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
