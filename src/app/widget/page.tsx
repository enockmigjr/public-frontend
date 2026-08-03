import { notFound } from "next/navigation";
import { WidgetShell } from "@/features/widget/widget-shell";

interface Props {
  readonly searchParams: Promise<{ integrationKey?: string; parentOrigin?: string }>;
}

export default async function WidgetPage({ searchParams }: Props) {
  const { integrationKey, parentOrigin } = await searchParams;
  if (!integrationKey || integrationKey.length < 16 || !validOrigin(parentOrigin)) notFound();
  return <WidgetShell integrationKey={integrationKey} parentOrigin={parentOrigin} />;
}

function validOrigin(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === value && (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost"));
  } catch { return false; }
}
