"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock3, Hash } from "lucide-react";
import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { PageHeading } from "@/components/portal/page-heading";
import { StatusBadge } from "@/components/portal/status";
import { Card, CardContent } from "@/components/ui/card";
import { publicApi } from "@/lib/api/client";
import { TicketTimeline } from "@/features/timeline/timeline";
import { AttachmentsPanel } from "./attachments-panel";
import { publicPollingInterval } from "@/features/realtime/public-realtime";
import { usePublicRealtime } from "@/features/realtime/public-realtime-provider";

const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export function TicketDetail({ ticketId }: { readonly ticketId: string }) {
  const realtime = usePublicRealtime();
  const query = useQuery({ queryKey: ["public-ticket", ticketId], queryFn: () => publicApi.ticket(ticketId), refetchInterval: (state) => publicPollingInterval(realtime, state.state.fetchFailureCount) });
  if (query.isLoading) return <LoadingState label="Chargement de la demande…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => query.refetch()} />;
  const ticket = query.data?.data;
  if (!ticket) return null;
  return <><PageHeading eyebrow={ticket.ticketNumber} title={ticket.title} description="Les informations affichées ici sont celles autorisées pour le demandeur." action={<StatusBadge status={ticket.status} />} />
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><Meta icon={Hash} label="Référence" value={ticket.ticketNumber} /><Meta icon={CalendarClock} label="Créée le" value={date.format(new Date(ticket.createdAt))} /><Meta icon={Clock3} label="Dernière mise à jour" value={date.format(new Date(ticket.updatedAt))} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><div><Card className="mb-6"><CardContent className="p-5"><h2 className="font-semibold">Description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p></CardContent></Card><h2 className="mb-4 text-lg font-semibold">Suivi et échanges</h2><TicketTimeline ticketId={ticketId} /></div><aside className="space-y-4"><AttachmentsPanel ticketId={ticketId} /><Card><CardContent className="p-4"><h2 className="font-semibold">Délais indicatifs</h2><Deadline label="Première réponse" value={ticket.firstResponseDueAt} /><Deadline label="Résolution visée" value={ticket.resolutionDueAt} /><p className="mt-3 text-xs leading-5 text-muted-foreground">Ces échéances peuvent évoluer selon la qualification et les informations nécessaires.</p></CardContent></Card><Link href="/demandes" className="block rounded-lg border bg-white px-4 py-2 text-center text-sm font-medium hover:bg-muted">Retour aux demandes</Link></aside></div>
  </>;
}

function Meta({ icon: Icon, label, value }: { readonly icon: typeof Hash; readonly label: string; readonly value: string }) { return <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" />{label}</div><p className="mt-2 truncate text-sm font-medium">{value}</p></div>; }
function Deadline({ label, value }: { readonly label: string; readonly value?: string | null }) { return <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right text-xs">{value ? date.format(new Date(value)) : "À confirmer"}</strong></div>; }
