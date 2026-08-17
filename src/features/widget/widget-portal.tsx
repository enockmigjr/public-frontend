"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, CirclePlus, ExternalLink, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, widgetApi } from "@/lib/api/client";
import { statusLabel } from "@/components/portal/status";
import { AssistantPanel } from "@/features/conversation/assistant-panel";
import { WidgetRequestForm } from "./widget-request-form";

type View = { readonly kind: "list" } | { readonly kind: "create" } | { readonly kind: "assistant" } | { readonly kind: "detail"; readonly id: string };
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function WidgetPortal({ onOpenPortal, onSessionExpired }: { readonly onOpenPortal: () => void; readonly onSessionExpired: () => void }) {
  const [view, setView] = useState<View>({ kind: "list" });
  if (view.kind === "create") return <WidgetRequestForm onCancel={() => setView({ kind: "list" })} onCreated={(id) => setView({ kind: "detail", id })} />;
  if (view.kind === "assistant") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto">
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => setView({ kind: "list" })}><ArrowLeft />Mes demandes</Button>
        <AssistantPanel compact api={widgetApi} onOpenForm={() => setView({ kind: "create" })} onSessionExpired={onSessionExpired} />
      </div>
    );
  }
  if (view.kind === "detail") return <WidgetTicket id={view.id} onBack={() => setView({ kind: "list" })} onSessionExpired={onSessionExpired} />;
  return <WidgetTicketList onCreate={() => setView({ kind: "create" })} onAssistant={() => setView({ kind: "assistant" })} onSelect={(id) => setView({ kind: "detail", id })} onOpenPortal={onOpenPortal} onSessionExpired={onSessionExpired} />;
}

function WidgetTicketList({ onCreate, onAssistant, onSelect, onOpenPortal, onSessionExpired }: { readonly onCreate: () => void; readonly onAssistant: () => void; readonly onSelect: (id: string) => void; readonly onOpenPortal: () => void; readonly onSessionExpired: () => void }) {
  const query = useQuery({ queryKey: ["widget-tickets"], queryFn: () => widgetApi.tickets(1) });
  if (query.error instanceof ApiError && query.error.status === 401) return <SessionExpired onContinue={onSessionExpired} />;
  return <div><div className="mb-4 flex gap-2"><Button className="flex-1" onClick={onCreate}><CirclePlus />Nouvelle demande</Button><Button variant="outline" size="icon" aria-label="Assistant" onClick={onAssistant}><Bot /></Button><Button variant="outline" size="icon" aria-label="Ouvrir le portail complet" onClick={onOpenPortal}><ExternalLink /></Button></div>{query.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Chargement des demandes…</p>}{query.error && <Alert variant="destructive"><AlertDescription>Impossible de charger vos demandes.</AlertDescription></Alert>}<div className="space-y-2">{query.data?.data.map((ticket) => <button type="button" key={ticket.id} onClick={() => onSelect(ticket.id)} className="w-full rounded-lg border bg-card p-3 text-left hover:bg-muted"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{ticket.title}</strong><Badge variant="outline">{statusLabel(ticket.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.ticketNumber} · {date.format(new Date(ticket.updatedAt))}</p></button>)}{query.data?.data.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune demande pour le moment.</p>}</div></div>;
}

function WidgetTicket({ id, onBack, onSessionExpired }: { readonly id: string; readonly onBack: () => void; readonly onSessionExpired: () => void }) {
  const client = useQueryClient();
  const [content, setContent] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const ticket = useQuery({ queryKey: ["widget-ticket", id], queryFn: () => widgetApi.ticket(id) });
  const timeline = useQuery({ queryKey: ["widget-timeline", id], queryFn: () => widgetApi.timeline(id) });
  const comment = useMutation({ mutationFn: () => widgetApi.comment(id, content, key), onSuccess: async () => { setContent(""); setKey(crypto.randomUUID()); await client.invalidateQueries({ queryKey: ["widget-timeline", id] }); } });
  if ((ticket.error instanceof ApiError && ticket.error.status === 401) || (timeline.error instanceof ApiError && timeline.error.status === 401)) return <SessionExpired onContinue={onSessionExpired} />;
  return <div><Button variant="ghost" size="sm" className="mb-3" onClick={onBack}><ArrowLeft />Mes demandes</Button>{ticket.isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>}{ticket.data && <div className="mb-4"><div className="flex items-start justify-between gap-2"><h2 className="font-semibold leading-5">{ticket.data.data.title}</h2><Badge variant="outline">{statusLabel(ticket.data.data.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.data.data.ticketNumber}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-5">{ticket.data.data.description}</p></div>}<div className="max-h-48 space-y-2 overflow-y-auto pr-1">{timeline.data?.data.map((entry) => <div key={entry.id} className="rounded-lg bg-muted/50 p-3"><div className="flex justify-between gap-2 text-xs"><strong>{entry.author ?? (entry.type === "STATUS" ? statusLabel(entry.status) : "Support")}</strong><time>{date.format(new Date(entry.createdAt))}</time></div>{entry.content && <p className="mt-1 whitespace-pre-wrap text-xs leading-5">{entry.content}</p>}</div>)}</div><form className="mt-4" onSubmit={(event) => { event.preventDefault(); comment.mutate(); }}><label htmlFor="widget-comment" className="mb-1 flex items-center gap-1 text-xs font-medium"><MessageSquare className="size-3.5" />Ajouter un message</label><Textarea id="widget-comment" rows={3} value={content} onChange={(event) => setContent(event.target.value)} maxLength={10000} required /><div className="mt-2 flex justify-end"><Button type="submit" size="sm" disabled={!content.trim() || comment.isPending}>{comment.isPending ? "Envoi…" : "Publier"}</Button></div></form></div>;
}

function SessionExpired({ onContinue }: { readonly onContinue: () => void }) { return <Alert><AlertDescription>Votre session doit être vérifiée à nouveau.<Button variant="link" className="h-auto px-1" onClick={onContinue}>Continuer</Button></AlertDescription></Alert>; }
