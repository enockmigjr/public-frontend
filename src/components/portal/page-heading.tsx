import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { readonly eyebrow?: string; readonly title: string; readonly description?: string; readonly action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-base leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
