import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/portal/status";
import type { PublicTicket } from "@/lib/api/client";

const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export function TicketCard({ ticket }: { readonly ticket: PublicTicket }) {
  return <Card className="transition-shadow hover:shadow-md"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span><StatusBadge status={ticket.status} /></div><h2 className="truncate font-semibold">{ticket.title}</h2><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Mise à jour le {date.format(new Date(ticket.updatedAt))}</p></div><Link href={`/demandes/${ticket.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Voir le suivi <ArrowRight className="size-4" /></Link></CardContent></Card>;
}
