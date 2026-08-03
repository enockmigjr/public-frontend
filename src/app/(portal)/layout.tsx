import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PublicRealtimeProvider } from "@/features/realtime/public-realtime-provider";

export default function PortalLayout({ children }: { readonly children: ReactNode }) {
  return <PublicRealtimeProvider context="portal"><PortalShell>{children}</PortalShell></PublicRealtimeProvider>;
}
