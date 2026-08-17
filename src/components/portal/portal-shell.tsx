"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, ClipboardList, Laptop, Radio, UserRound } from "lucide-react";
import { Brand } from "@/components/portal/brand";
import { OfflineNotice } from "@/components/portal/page-state";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { usePublicRealtime } from "@/features/realtime/public-realtime-provider";

const links = [
  { href: "/demandes", label: "Mes demandes", icon: ClipboardList },
  { href: "/nouvelle-demande", label: "Nouvelle demande", icon: CirclePlus },
  { href: "/profil", label: "Profil", icon: UserRound },
  { href: "/appareils", label: "Appareils", icon: Laptop },
] as const;

export function PortalShell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  const realtime = usePublicRealtime();
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
      <OfflineNotice />
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:h-16 sm:px-8 lg:px-12">
          <Brand href="/demandes" />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex" role="status">
              <Radio className={cn("size-3.5", realtime === "connected" ? "text-emerald-700" : "text-amber-700")} />
              {realtime === "connected" ? "Temps réel actif" : realtime === "connecting" ? "Connexion…" : "Actualisation automatique"}
            </span>
            <Link href="/nouvelle-demande" className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:block">Signaler un incident</Link>
          </div>
        </div>
      </header>
      <div className="grid w-full flex-1 items-start gap-4 px-4 py-5 sm:gap-6 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:px-12 lg:py-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="no-scrollbar min-w-0 max-w-full overflow-x-auto lg:overflow-visible">
          <nav aria-label="Navigation de l’espace demandeur" className="flex w-max gap-1 rounded-xl p-1 lg:w-auto lg:min-w-0 lg:flex-col lg:rounded-2xl lg:border lg:bg-card lg:p-2">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground")}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
