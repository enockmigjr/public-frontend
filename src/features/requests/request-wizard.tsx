"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function RequestWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<TicketDraft>(initial);
  const [confirmed, setConfirmed] = useState(false);
  const [intentKey] = useState(() => crypto.randomUUID());
  const catalog = useQuery({ queryKey: ["public-catalog"], queryFn: publicApi.catalog });
  const submit = useMutation({ mutationFn: async () => { const conversation = await publicApi.createConversation(`${intentKey}:conversation`, draft.serviceKey); await publicApi.saveDraft(conversation.data.id, draft); return publicApi.confirm(conversation.data.id, `${intentKey}:confirm`); }, onSuccess: (result) => router.push(`/demandes/${result.data.ticketId}`) });
  if (catalog.isLoading) return <LoadingState label="Préparation du formulaire…" />;
  if (catalog.error) return <ErrorState message={catalog.error.message} retry={() => catalog.refetch()} />;
  const data = catalog.data?.data;
  const canContinue = step === 1 ? Boolean(draft.categoryId && draft.title.length >= 5) : draft.description.length >= 10;

  return <Card><CardContent className="p-5 sm:p-7"><div className="mb-8"><div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>Étape {step} sur 3</span><span>{step === 1 ? "Identification" : step === 2 ? "Description" : "Confirmation"}</span></div><Progress value={(step / 3) * 100} /></div>
    {step === 1 && <div className="space-y-5"><Field id="service" label="Service concerné"><select id="service" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.serviceKey ?? ""} onChange={(event) => setDraft({ ...draft, serviceKey: event.target.value || undefined })}><option value="">Sélectionner un service (facultatif)</option>{data?.services.map((service) => <option key={service.key} value={service.key}>{service.label}</option>)}</select></Field><Field id="category" label="Catégorie"><select id="category" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}><option value="">Sélectionner une catégorie</option>{data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field id="title" label="Objet de la demande"><Input id="title" value={draft.title} minLength={5} maxLength={255} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex. Coupures fréquentes sur ma ligne" /></Field><Field id="account" label="Référence client (facultatif)"><Input id="account" value={draft.customerAccountNumber ?? ""} maxLength={100} onChange={(event) => setDraft({ ...draft, customerAccountNumber: event.target.value || undefined })} autoComplete="off" /></Field></div>}
    {step === 2 && <div className="space-y-5"><Field id="description" label="Décrivez précisément le problème"><Textarea id="description" value={draft.description} minLength={10} maxLength={10000} rows={7} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Depuis quand, à quelle fréquence, et quel est l’impact sur votre activité ?" /><p className="text-right text-xs text-muted-foreground">{draft.description.length} / 10 000</p></Field><div className="grid gap-4 sm:grid-cols-2"><LevelField label="Impact sur votre activité" value={draft.impact} onChange={(impact) => setDraft({ ...draft, impact })} /><LevelField label="Urgence ressentie" value={draft.urgency} onChange={(urgency) => setDraft({ ...draft, urgency })} /></div></div>}
    {step === 3 && <div className="space-y-5"><div className="rounded-xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Votre demande</p><h2 className="mt-2 text-lg font-semibold">{draft.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{draft.description}</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-1 size-4 accent-sky-700" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong className="block text-sm">Je confirme l’envoi de cette demande</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Les informations seront transmises au support. Vous pourrez ensuite ajouter des pièces jointes et suivre les réponses.</span></span></label>{submit.error && <Alert variant="destructive"><AlertDescription>{submit.error instanceof ApiError ? submit.error.message : "L’envoi a échoué."}</AlertDescription></Alert>}<div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />Transmission sécurisée et confirmation explicite.</div></div>}
    <div className="mt-8 flex justify-between"><Button variant="outline" disabled={step === 1 || submit.isPending} onClick={() => setStep((value) => value - 1)}><ArrowLeft />Retour</Button>{step < 3 ? <Button disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Continuer<ArrowRight /></Button> : <Button disabled={!confirmed || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? "Envoi…" : <>Envoyer la demande<Check /></>}</Button>}</div>
  </CardContent></Card>;
}

function Field({ id, label, children }: { readonly id: string; readonly label: string; readonly children: React.ReactNode }) { return <div className="space-y-2"><label htmlFor={id} className="block text-sm font-medium">{label}</label>{children}</div>; }
function LevelField({ label, value, onChange }: { readonly label: string; readonly value: TicketDraft["impact"]; readonly onChange: (value: TicketDraft["impact"]) => void }) { return <fieldset><legend className="mb-2 text-sm font-medium">{label}</legend><div className="grid grid-cols-3 gap-2">{levels.map((level) => <button type="button" key={level.value} aria-pressed={value === level.value} onClick={() => onChange(level.value)} className={`rounded-lg border px-2 py-2 text-xs font-medium ${value === level.value ? "border-sky-700 bg-sky-50 text-sky-900" : "bg-white"}`}>{level.label}</button>)}</div></fieldset>; }
