"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, widgetApi, type TicketDraft } from "@/lib/api/client";

const initial: TicketDraft = { categoryId: "", title: "", description: "", impact: "MEDIUM", urgency: "MEDIUM" };

export function WidgetRequestForm({ onCancel, onCreated }: { readonly onCancel: () => void; readonly onCreated: (id: string) => void }) {
  const [draft, setDraft] = useState<TicketDraft>(initial);
  const [confirmed, setConfirmed] = useState(false);
  const [intentKey] = useState(() => crypto.randomUUID());
  const catalog = useQuery({ queryKey: ["widget-catalog"], queryFn: widgetApi.catalog });
  const submit = useMutation({
    mutationFn: async () => {
      const conversation = await widgetApi.createConversation(`${intentKey}:conversation`, draft.serviceKey);
      await widgetApi.saveDraft(conversation.data.id, draft);
      return widgetApi.confirm(conversation.data.id, `${intentKey}:confirm`);
    },
    onSuccess: (result) => onCreated(result.data.ticketId),
  });
  const valid = draft.categoryId && draft.title.trim().length >= 5 && draft.description.trim().length >= 10 && confirmed;
  return <form onSubmit={(event) => { event.preventDefault(); submit.mutate(); }} className="space-y-3">
    <div><label htmlFor="widget-category" className="mb-1 block text-xs font-medium">Catégorie</label><select id="widget-category" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} required><option value="">Sélectionner</option>{catalog.data?.data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
    <div><label htmlFor="widget-title" className="mb-1 block text-xs font-medium">Objet</label><Input id="widget-title" minLength={5} maxLength={255} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></div>
    <div><label htmlFor="widget-description" className="mb-1 block text-xs font-medium">Description</label><Textarea id="widget-description" rows={5} minLength={10} maxLength={10000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required /></div>
    <div className="grid grid-cols-2 gap-2"><Level label="Impact" value={draft.impact} onChange={(impact) => setDraft({ ...draft, impact })} /><Level label="Urgence" value={draft.urgency} onChange={(urgency) => setDraft({ ...draft, urgency })} /></div>
    <label className="flex items-start gap-2 rounded-lg border p-3 text-xs"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" />Je confirme l’envoi de ces informations au support.</label>
    {submit.error && <Alert variant="destructive"><AlertDescription>{submit.error instanceof ApiError ? submit.error.message : "La demande n’a pas été envoyée."}</AlertDescription></Alert>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Annuler</Button><Button type="submit" disabled={!valid || submit.isPending}>{submit.isPending ? "Envoi…" : "Envoyer"}</Button></div>
  </form>;
}

function Level({ label, value, onChange }: { readonly label: string; readonly value: TicketDraft["impact"]; readonly onChange: (value: TicketDraft["impact"]) => void }) {
  return <label className="text-xs font-medium">{label}<select className="mt-1 h-9 w-full rounded-lg border bg-background px-2 text-xs" value={value} onChange={(event) => { const next = event.target.value; if (next === "LOW" || next === "MEDIUM" || next === "HIGH") onChange(next); }}><option value="LOW">Faible</option><option value="MEDIUM">Moyen</option><option value="HIGH">Élevé</option></select></label>;
}
