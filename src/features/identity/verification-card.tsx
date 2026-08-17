"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, publicApi, type PublicApi } from "@/lib/api/client";

export function VerificationCard({ api = publicApi, onVerified }: { readonly api?: PublicApi; readonly onVerified?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string>();
  const complete = () => onVerified ? onVerified() : router.push("/demandes");
  const restore = useMutation({ mutationFn: api.restore, onSuccess: complete });
  const requestCode = useMutation({ mutationFn: () => api.requestCode(email), onSuccess: (result) => setChallengeId(result.data.challengeId) });
  const verify = useMutation({ mutationFn: () => api.consumeCode(challengeId ?? "", code), onSuccess: complete });
  const error = restore.error ?? requestCode.error ?? verify.error;

  return <Card className="w-full max-w-md border-border shadow-xl shadow-black/5">
    <CardHeader><div className="mb-3 grid size-11 place-items-center rounded-xl bg-muted text-foreground">{challengeId ? <LockKeyhole /> : <Mail />}</div><CardTitle>{challengeId ? "Entrez le code reçu" : "Accédez à vos demandes"}</CardTitle><CardDescription>{challengeId ? `Nous avons envoyé un code à ${email}.` : "Aucun compte ni mot de passe requis. Votre adresse sert à retrouver vos demandes en toute sécurité."}</CardDescription></CardHeader>
    <CardContent>
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error instanceof ApiError ? error.message : "Le service est momentanément indisponible."}</AlertDescription></Alert>}
      {!challengeId ? <form onSubmit={(event) => { event.preventDefault(); requestCode.mutate(); }} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Adresse email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@entreprise.com" required /></div><Button type="submit" size="lg" className="w-full" disabled={requestCode.isPending}>{requestCode.isPending ? "Envoi…" : <>Recevoir un code <ArrowRight /></>}</Button></form> : <form onSubmit={(event) => { event.preventDefault(); verify.mutate(); }} className="space-y-4"><div className="space-y-2"><Label htmlFor="code">Code à 6 chiffres</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="h-12 text-center font-mono text-xl tracking-[0.4em]" required /></div><Button type="submit" size="lg" className="w-full" disabled={verify.isPending}>{verify.isPending ? "Vérification…" : <>Continuer <CheckCircle2 /></>}</Button><Button type="button" variant="ghost" className="w-full" onClick={() => { setChallengeId(undefined); setCode(""); }}>Changer d’adresse</Button></form>}
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
      <Button variant="outline" className="w-full" disabled={restore.isPending} onClick={() => restore.mutate()}>{restore.isPending ? "Recherche…" : "Continuer sur cet appareil"}</Button>
      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Après vérification, cet appareil peut rester reconnu selon la politique définie par le support.</p>
    </CardContent>
  </Card>;
}
