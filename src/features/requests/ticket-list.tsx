"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal/page-state";
import { Button } from "@/components/ui/button";
import { ApiError, publicApi } from "@/lib/api/client";
import { TicketCard } from "./ticket-card";

export function TicketList() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["public-tickets", page], queryFn: () => publicApi.tickets(page) });
  if (query.isLoading) return <LoadingState label="Chargement de vos demandes…" />;
  if (query.error) {
    if (query.error instanceof ApiError && query.error.status === 401) return <EmptyState title="Vérification requise" description="Revenez à l’accueil pour vérifier votre contact et retrouver vos demandes." />;
    return <ErrorState message={query.error.message} retry={() => query.refetch()} />;
  }
  const tickets = query.data?.data ?? [];
  if (!tickets.length && page === 1) return <div><EmptyState title="Aucune demande pour le moment" description="Créez votre première demande : notre équipe pourra la qualifier et vous tenir informé ici." /><Link href="/nouvelle-demande" className="mx-auto mt-4 flex w-fit rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white">Créer une demande</Link></div>;
  const meta = query.data?.meta;
  return <div className="space-y-3">{tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}<div className="flex items-center justify-between pt-4"><p className="text-sm text-muted-foreground">Page {meta?.page ?? page}{meta?.totalPages ? ` sur ${meta.totalPages}` : ""}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)}><ChevronLeft />Précédent</Button><Button variant="outline" disabled={query.isFetching || (meta ? page >= meta.totalPages : tickets.length < 10)} onClick={() => setPage((value) => value + 1)}>Suivant<ChevronRight /></Button></div></div></div>;
}
