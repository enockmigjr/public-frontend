"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Radio } from "lucide-react";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { statusLabel } from "@/components/portal/status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, publicApi } from "@/lib/api/client";
import { publicPollingInterval } from "@/features/realtime/public-realtime";
import { usePublicRealtime } from "@/features/realtime/public-realtime-provider";

const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function TicketTimeline({ ticketId }: { readonly ticketId: string }) {
  const client = useQueryClient();
  const realtime = usePublicRealtime();
  const [content, setContent] = useState("");
  const [intentKey, setIntentKey] = useState(() => crypto.randomUUID());
  const query = useQuery({ queryKey: ["public-timeline", ticketId], queryFn: () => publicApi.timeline(ticketId), refetchInterval: (state) => publicPollingInterval(realtime, state.state.fetchFailureCount) });
  const comment = useMutation({ mutationFn: () => publicApi.comment(ticketId, content, intentKey), onSuccess: async () => { setContent(""); setIntentKey(crypto.randomUUID()); await client.invalidateQueries({ queryKey: ["public-timeline", ticketId] }); } });
  if (query.isLoading) return <LoadingState label="Chargement des échanges…" />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => query.refetch()} />;
  return <div className="space-y-6">
    <div aria-live="polite" className="space-y-1">{query.data?.data.length ? query.data.data.map((entry) => <article key={entry.id} className="relative grid grid-cols-[32px_1fr] gap-3 pb-6 last:pb-0"><div className="absolute bottom-0 left-4 top-8 w-px bg-border last:hidden" /><span className={`z-10 grid size-8 place-items-center rounded-full ${entry.type === "COMMENT" ? "bg-muted text-foreground" : "bg-muted text-foreground"}`}>{entry.type === "COMMENT" ? <MessageSquare className="size-4" /> : <Radio className="size-4" />}</span><div className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{entry.type === "COMMENT" ? entry.author ?? "Équipe support" : statusLabel(entry.status)}</strong><time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>{date.format(new Date(entry.createdAt))}</time></div>{entry.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{entry.content}</p>}</div></article>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun échange publié pour le moment.</p>}</div>
    <form onSubmit={(event) => { event.preventDefault(); comment.mutate(); }} className="rounded-xl border bg-card p-4"><label htmlFor="comment" className="mb-2 block text-sm font-semibold">Ajouter un message</label><Textarea id="comment" rows={4} minLength={1} maxLength={10000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Complétez votre demande ou répondez à l’équipe support…" required />{comment.error && <Alert variant="destructive" className="mt-3"><AlertDescription>{comment.error instanceof ApiError ? comment.error.message : "Le message n’a pas été envoyé."}</AlertDescription></Alert>}<div className="mt-3 flex justify-end"><Button type="submit" disabled={!content.trim() || comment.isPending}>{comment.isPending ? "Envoi…" : "Publier le message"}</Button></div></form>
  </div>;
}
