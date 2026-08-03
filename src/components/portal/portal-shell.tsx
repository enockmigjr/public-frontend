"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, ClipboardList, Laptop, UserRound } from "lucide-react";
import { Brand } from "@/components/portal/brand";
import { OfflineNotice } from "@/components/portal/page-state";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const links = [
  { href: "/demandes", label: "Mes demandes", icon: ClipboardList },
  { href: "/nouvelle-demande", label: "Nouvelle demande", icon: CirclePlus },
  { href: "/profil", label: "Profil", icon: UserRound },
  { href: "/appareils", label: "Appareils", icon: Laptop },
] as const;

export function PortalShell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <OfflineNotice />
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Brand href="/demandes" /><Link href="/nouvelle-demande" className="hidden rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:block">Signaler un incident</Link></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:py-10">
      <aside className="overflow-x-auto lg:overflow-visible"><nav aria-label="Navigation de l’espace demandeur" className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">{links.map(({ href, label, icon: Icon }) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sky-100 text-sky-950" : "text-slate-600 hover:bg-white hover:text-slate-950")}><Icon className="size-4" />{label}</Link>; })}</nav></aside>
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
