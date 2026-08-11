import { notFound } from "next/navigation";
import { isLocalDevOrigin } from "@/lib/origins";
import { WidgetShell } from "@/features/widget/widget-shell";
import { PublicRealtimeProvider } from "@/features/realtime/public-realtime-provider";

interface Props {
  readonly searchParams: Promise<{ integrationKey?: string; parentOrigin?: string }>;
}

export default async function WidgetPage({ searchParams }: Props) {
  const { integrationKey, parentOrigin } = await searchParams;
  if (!integrationKey || integrationKey.length < 16 || !validOrigin(parentOrigin)) notFound();
  return <PublicRealtimeProvider context="widget"><WidgetShell integrationKey={integrationKey} parentOrigin={parentOrigin} /></PublicRealtimeProvider>;
}

function validOrigin(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === value && (url.protocol === "https:" || isLocalDevOrigin(value));
  } catch { return false; }
}
