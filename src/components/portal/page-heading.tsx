import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { readonly eyebrow?: string; readonly title: string; readonly description?: string; readonly action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sky-700">{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}
