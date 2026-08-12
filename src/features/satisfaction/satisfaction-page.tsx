"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, publicApi } from "@/lib/api/client";

export function SatisfactionPage({ token, ticketId }: Readonly<{ token: string; ticketId: string }>) {
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useMutation({
    mutationFn: () => publicApi.submitSatisfaction(ticketId, token, note, comment.trim() || undefined),
  });

  if (!token || !ticketId) {
    return <Centered><Alert variant="destructive"><AlertDescription>Lien de satisfaction invalide.</AlertDescription></Alert></Centered>;
  }
  if (submit.isSuccess) {
    return <Centered><Alert><AlertDescription>Merci, votre retour a bien été enregistré.</AlertDescription></Alert></Centered>;
  }

  return (
    <Centered>
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Comment s&apos;est passée votre prise en charge ?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Votre retour nous aide à améliorer notre service.</p>
        <div className="mt-4 flex justify-between gap-1" role="radiogroup" aria-label="Note de satisfaction">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-checked={note === value}
              role="radio"
              onClick={() => setNote(value)}
              className={`grid size-11 place-items-center rounded-xl border text-lg font-semibold transition-colors ${
                note >= value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="mt-4 grid gap-1 text-sm font-medium">
          Commentaire (optionnel)
          <Textarea rows={3} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Décrivez votre expérience…" />
        </label>
        {submit.error ? (
          <p className="mt-3 text-sm text-destructive">
            {submit.error instanceof ApiError ? submit.error.message : "Impossible d'enregistrer votre retour."}
          </p>
        ) : null}
        <Button type="button" className="mt-4 w-full" disabled={note === 0 || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? "Envoi…" : "Envoyer mon avis"}
        </Button>
      </div>
    </Centered>
  );
}

function Centered({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="grid min-h-dvh place-items-center bg-slate-50 p-4">{children}</main>;
}
