"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, publicApi, type TicketDraft } from "@/lib/api/client";

const levels = [
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyen" },
  { value: "HIGH", label: "Élevé" },
] as const;
const initial: TicketDraft = { categoryId: "", title: "", description: "", impact: "MEDIUM", urgency: "MEDIUM" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function RequestWizard({ resumeId }: { readonly resumeId?: string }) {
  const safeResumeId = resumeId && uuid.test(resumeId) ? resumeId : undefined;
  const catalog = useQuery({ queryKey: ["public-catalog"], queryFn: publicApi.catalog });
  const resume = useQuery({
    queryKey: ["public-conversation", safeResumeId],
    queryFn: () => publicApi.conversation(safeResumeId ?? ""),
    enabled: Boolean(safeResumeId),
  });
  if (catalog.isLoading || resume.isLoading) return <LoadingState label="Préparation du formulaire…" />;
  if (catalog.error) return <ErrorState message={catalog.error.message} retry={() => catalog.refetch()} />;
  if (resume.error) return <ErrorState message={resume.error.message} retry={() => resume.refetch()} />;
  const conversation = resume.data?.data;
  if (conversation?.ticketId) return <AlreadySent ticketId={conversation.ticketId} />;
  return (
    <RequestForm
      key={conversation?.id ?? "new"}
      catalog={catalog.data?.data}
      conversationId={conversation?.id}
      initialDraft={conversation?.draft ?? initial}
    />
  );
}

function RequestForm({ catalog, conversationId, initialDraft }: {
  readonly catalog?: Awaited<ReturnType<typeof publicApi.catalog>>["data"];
  readonly conversationId?: string;
  readonly initialDraft: TicketDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<TicketDraft>(initialDraft);
  const [confirmed, setConfirmed] = useState(false);
  const [intentKey] = useState(() => crypto.randomUUID());
  const submit = useMutation({
    mutationFn: async () => {
      const id = conversationId ?? (await publicApi.createConversation(`${intentKey}:conversation`, draft.serviceKey)).data.id;
      await publicApi.saveDraft(id, draft);
      return publicApi.confirm(id, `${intentKey}:confirm`);
    },
    onSuccess: (result) => router.push(`/demandes/${result.data.ticketId}`),
  });
  const valid = Boolean(draft.categoryId) && draft.title.trim().length >= 5 && draft.description.trim().length >= 10 && confirmed;
  return (
    <Card>
      <CardContent className="p-5 sm:p-8">
        <form onSubmit={(event) => { event.preventDefault(); submit.mutate(); }} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="category" label="Catégorie" className="sm:col-span-2">
              <select id="category" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
                <option value="">Sélectionner une catégorie</option>
                {catalog?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field id="title" label="Objet de la demande" className="sm:col-span-2">
              <Input id="title" value={draft.title} minLength={5} maxLength={255} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex. Coupures fréquentes sur ma ligne" />
            </Field>
            <Field id="description" label="Décrivez précisément le problème" className="sm:col-span-2">
              <Textarea id="description" value={draft.description} minLength={10} maxLength={10000} rows={6} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Depuis quand, à quelle fréquence, et quel est l'impact sur votre activité ?" />
              <p className="text-right text-xs text-muted-foreground">{draft.description.length} / 10 000</p>
            </Field>
            <LevelField label="Impact sur votre activité" value={draft.impact} onChange={(impact) => setDraft({ ...draft, impact })} />
            <LevelField label="Urgence ressentie" value={draft.urgency} onChange={(urgency) => setDraft({ ...draft, urgency })} />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
            <input type="checkbox" className="mt-1 size-4 accent-blue-700" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>
              <strong className="block text-sm">Je confirme l&apos;envoi de cette demande</strong>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Les informations seront transmises au support. Vous pourrez ensuite ajouter des pièces jointes et suivre les réponses.</span>
            </span>
          </label>
          {submit.error && <Alert variant="destructive"><AlertDescription>{submit.error instanceof ApiError ? submit.error.message : "La demande n'a pas été envoyée."}</AlertDescription></Alert>}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />Transmission sécurisée et confirmation explicite.</p>
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!valid || submit.isPending}>{submit.isPending ? "Envoi en cours…" : <>Envoyer la demande<Send /></>}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AlreadySent({ ticketId }: { readonly ticketId: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check className="size-5" /></span>
          <div>
            <h2 className="font-semibold">Cette demande a déjà été envoyée</h2>
            <p className="mt-1 text-sm text-muted-foreground">Votre demande est en cours de traitement par le support.</p>
            <Button className="mt-4" render={<a href={`/demandes/${ticketId}`} />}>Voir la demande</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ id, label, className, children }: { readonly id: string; readonly label: string; readonly className?: string; readonly children: React.ReactNode }) {
  return <div className={className ?? ""}><label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>{children}</div>;
}

function LevelField({ label, value, onChange }: { readonly label: string; readonly value: TicketDraft["impact"]; readonly onChange: (value: TicketDraft["impact"]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {levels.map((level) => (
          <button type="button" key={level.value} aria-pressed={value === level.value} onClick={() => onChange(level.value)} className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${value === level.value ? "border-blue-700 bg-blue-50 text-blue-900" : "bg-white hover:bg-muted"}`}>{level.label}</button>
        ))}
      </div>
    </fieldset>
  );
}
