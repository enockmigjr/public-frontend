"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, publicApi, type TicketDraft } from "@/lib/api/client";

const levels = [{ value: "LOW", label: "Faible" }, { value: "MEDIUM", label: "Moyen" }, { value: "HIGH", label: "Élevé" }] as const;
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
  if (conversation?.ticketId) return <CreatedTicket ticketId={conversation.ticketId} />;
  return <Wizard
    key={conversation?.id ?? "new"}
    catalog={catalog.data?.data}
    initialConversationId={conversation?.id}
    initialDraft={conversation?.draft ?? initial}
    initialStep={conversation?.draft ? 2 : 1}
  />;
}

function Wizard({ catalog, initialConversationId, initialDraft, initialStep }: {
  readonly catalog?: Awaited<ReturnType<typeof publicApi.catalog>>["data"];
  readonly initialConversationId?: string;
  readonly initialDraft: TicketDraft;
  readonly initialStep: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<TicketDraft>(initialDraft);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [confirmed, setConfirmed] = useState(false);
  const [intentKey] = useState(() => crypto.randomUUID());
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const enqueueSave = useCallback((id: string, snapshot: TicketDraft) => {
    const operation = saveQueue.current
      .catch(() => undefined)
      .then(async () => { await publicApi.saveDraft(id, snapshot); });
    saveQueue.current = operation.catch(() => undefined);
    return operation;
  }, []);
  const { mutate: autosaveDraft, isPending: autosavePending, isSuccess: autosaveSuccess, error: autosaveError } = useMutation({ mutationFn: () => {
    if (!conversationId) throw new ApiError("Conversation absente.", 409);
    return enqueueSave(conversationId, draft);
  } });
  useEffect(() => {
    if (step !== 2 || !conversationId || !draft.categoryId || draft.title.trim().length < 5 || draft.description.trim().length < 10) return;
    const timer = window.setTimeout(() => autosaveDraft(), 800);
    return () => window.clearTimeout(timer);
  }, [autosaveDraft, conversationId, draft, step]);
  const advance = useMutation({
    mutationFn: async () => {
      if (step === 1 && !conversationId) {
        const created = await publicApi.createConversation(`${intentKey}:conversation`, draft.serviceKey);
        return created.data.id;
      }
      if (step === 2 && conversationId) await enqueueSave(conversationId, draft);
      return conversationId;
    },
    onSuccess: (id) => {
      if (id && id !== conversationId) {
        setConversationId(id);
        router.replace(`/nouvelle-demande?conversation=${id}`, { scroll: false });
      }
      setStep((value) => value + 1);
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!conversationId) throw new ApiError("La conversation doit être enregistrée avant l’envoi.", 409);
      await enqueueSave(conversationId, draft);
      return publicApi.confirm(conversationId, `${intentKey}:confirm`);
    },
    onSuccess: (result) => router.push(`/demandes/${result.data.ticketId}`),
  });
  const error = advance.error ?? submit.error;
  const canContinue = step === 1 ? Boolean(draft.categoryId && draft.title.trim().length >= 5) : draft.description.trim().length >= 10;

  return <Card><CardContent className="p-5 sm:p-7">
    <div className="mb-8"><div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>Étape {step} sur 3</span><span>{step === 1 ? "Identification" : step === 2 ? "Description" : "Confirmation"}</span></div><Progress value={(step / 3) * 100} /></div>
    {step === 1 && <IdentityStep draft={draft} catalog={catalog} update={setDraft} />}
    {step === 2 && <><DescriptionStep draft={draft} update={setDraft} /><p className="mt-3 text-right text-xs text-muted-foreground" aria-live="polite">{autosavePending ? "Enregistrement du brouillon…" : autosaveSuccess ? "Brouillon enregistré" : "Le brouillon sera enregistré automatiquement."}</p></>}
    {step === 3 && <ConfirmationStep draft={draft} confirmed={confirmed} setConfirmed={setConfirmed} />}
    {(error || autosaveError) && <Alert variant="destructive" className="mt-5"><AlertDescription>{error instanceof ApiError ? error.message : "L’enregistrement a échoué. Votre formulaire est conservé dans cette page."}</AlertDescription></Alert>}
    <div className="mt-8 flex justify-between"><Button variant="outline" disabled={step === 1 || advance.isPending || submit.isPending} onClick={() => setStep((value) => value - 1)}><ArrowLeft />Retour</Button>{step < 3 ? <Button disabled={!canContinue || advance.isPending} onClick={() => advance.mutate()}>{advance.isPending ? "Enregistrement…" : <>Continuer<ArrowRight /></>}</Button> : <Button disabled={!confirmed || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? "Envoi…" : <>Envoyer la demande<Check /></>}</Button>}</div>
  </CardContent></Card>;
}

function IdentityStep({ draft, catalog, update }: { readonly draft: TicketDraft; readonly catalog?: Awaited<ReturnType<typeof publicApi.catalog>>["data"]; readonly update: (draft: TicketDraft) => void }) {
  return <div className="space-y-5"><Field id="service" label="Service concerné"><select id="service" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.serviceKey ?? ""} onChange={(event) => update({ ...draft, serviceKey: event.target.value || undefined })}><option value="">Sélectionner un service (facultatif)</option>{catalog?.services.map((service) => <option key={service.key} value={service.key}>{service.label}</option>)}</select></Field><Field id="category" label="Catégorie"><select id="category" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.categoryId} onChange={(event) => update({ ...draft, categoryId: event.target.value })}><option value="">Sélectionner une catégorie</option>{catalog?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field id="title" label="Objet de la demande"><Input id="title" value={draft.title} minLength={5} maxLength={255} onChange={(event) => update({ ...draft, title: event.target.value })} placeholder="Ex. Coupures fréquentes sur ma ligne" /></Field><Field id="account" label="Référence client (facultatif)"><Input id="account" value={draft.customerAccountNumber ?? ""} maxLength={100} onChange={(event) => update({ ...draft, customerAccountNumber: event.target.value || undefined })} autoComplete="off" /></Field></div>;
}

function DescriptionStep({ draft, update }: { readonly draft: TicketDraft; readonly update: (draft: TicketDraft) => void }) {
  return <div className="space-y-5"><Field id="description" label="Décrivez précisément le problème"><Textarea id="description" value={draft.description} minLength={10} maxLength={10000} rows={7} onChange={(event) => update({ ...draft, description: event.target.value })} placeholder="Depuis quand, à quelle fréquence, et quel est l’impact sur votre activité ?" /><p className="text-right text-xs text-muted-foreground">{draft.description.length} / 10 000</p></Field><div className="grid gap-4 sm:grid-cols-2"><LevelField label="Impact sur votre activité" value={draft.impact} onChange={(impact) => update({ ...draft, impact })} /><LevelField label="Urgence ressentie" value={draft.urgency} onChange={(urgency) => update({ ...draft, urgency })} /></div></div>;
}

function ConfirmationStep({ draft, confirmed, setConfirmed }: { readonly draft: TicketDraft; readonly confirmed: boolean; readonly setConfirmed: (value: boolean) => void }) {
  return <div className="space-y-5"><div className="rounded-xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Votre demande</p><h2 className="mt-2 text-lg font-semibold">{draft.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{draft.description}</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-1 size-4 accent-sky-700" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong className="block text-sm">Je confirme l’envoi de cette demande</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Les informations seront transmises au support. Vous pourrez ensuite ajouter des pièces jointes et suivre les réponses.</span></span></label><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />Transmission sécurisée et confirmation explicite.</div></div>;
}

function CreatedTicket({ ticketId }: { readonly ticketId: string }) { return <Card><CardContent className="p-6"><h2 className="font-semibold">Cette demande a déjà été envoyée</h2><p className="mt-2 text-sm text-muted-foreground">Le brouillon a été converti en ticket. Aucun nouvel envoi n’a été effectué.</p><Button className="mt-5" render={<Link href={`/demandes/${ticketId}`} />}>Voir la demande</Button></CardContent></Card>; }
function Field({ id, label, children }: { readonly id: string; readonly label: string; readonly children: React.ReactNode }) { return <div className="space-y-2"><label htmlFor={id} className="block text-sm font-medium">{label}</label>{children}</div>; }
function LevelField({ label, value, onChange }: { readonly label: string; readonly value: TicketDraft["impact"]; readonly onChange: (value: TicketDraft["impact"]) => void }) { return <fieldset><legend className="mb-2 text-sm font-medium">{label}</legend><div className="grid grid-cols-3 gap-2">{levels.map((level) => <button type="button" key={level.value} aria-pressed={value === level.value} onClick={() => onChange(level.value)} className={`rounded-lg border px-2 py-2 text-xs font-medium ${value === level.value ? "border-sky-700 bg-sky-50 text-sky-900" : "bg-white"}`}>{level.label}</button>)}</div></fieldset>; }
