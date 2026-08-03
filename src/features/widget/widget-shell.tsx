"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LifeBuoy, LoaderCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { openFullPage } from "./full-page-fallback";
import { listenToHost, postToHost } from "./origin-handshake";

interface Props { readonly integrationKey: string; readonly parentOrigin: string }

export function WidgetShell({ integrationKey, parentOrigin }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "blocked" | "error">("loading");

  useEffect(() => {
    const query = new URLSearchParams({ context: "widget", integrationKey, origin: parentOrigin });
    fetch(`/api/config?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        return { ok: response.ok, body };
      })
      .then(({ ok, body }) => {
        if (!ok || !isFrameAllowed(body)) return setState("blocked");
        setState("ready");
        postToHost(parentOrigin, { type: "READY" });
      })
      .catch(() => setState("error"));
    return listenToHost(parentOrigin, (assertion) => void exchangeAssertion(assertion, setState));
  }, [integrationKey, parentOrigin]);

  useEffect(() => {
    if (state === "ready") postToHost(parentOrigin, { type: "RESIZE", height: 520 });
  }, [parentOrigin, state]);

  if (state === "loading") return <StatePanel icon={<LoaderCircle className="size-5 animate-spin" />} text="Ouverture du support…" />;
  if (state === "blocked") return <StatePanel icon={<ShieldCheck className="size-5" />} text="Ce site n’est pas autorisé à afficher ce support." />;
  if (state === "error") return <StatePanel icon={<LifeBuoy className="size-5" />} text="Le support est temporairement indisponible." />;
  return (
    <main className="flex min-h-dvh flex-col bg-background p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><LifeBuoy /></span>
        <div><p className="font-semibold">Assistance</p><p className="text-xs text-muted-foreground">Canal sécurisé</p></div>
      </div>
      <Alert className="mb-4 bg-card">
        <ShieldCheck />
        <AlertTitle>Votre demande reste confidentielle</AlertTitle>
        <AlertDescription>Vérifiez votre contact une seule fois, puis suivez vos demandes depuis cet appareil.</AlertDescription>
      </Alert>
      <div className="mt-auto grid gap-2">
        <Button size="lg" onClick={() => void openFullPage()}>Créer ou suivre une demande <ExternalLink /></Button>
        <p className="text-center text-xs text-muted-foreground">L’ouverture en pleine page fonctionne même si les cookies tiers sont bloqués.</p>
      </div>
    </main>
  );
}

function StatePanel({ icon, text }: { readonly icon: React.ReactNode; readonly text: string }) {
  return <main className="grid min-h-dvh place-items-center bg-background p-6"><div className="flex max-w-xs items-center gap-3 text-sm text-muted-foreground">{icon}<p>{text}</p></div></main>;
}

function isFrameAllowed(value: unknown): boolean {
  return isRecord(value) && value["success"] === true && isRecord(value["data"]) && value["data"]["frameAllowed"] === true;
}

async function exchangeAssertion(assertion: string, setState: (state: "loading" | "ready" | "blocked" | "error") => void) {
  const csrfResponse = await fetch("/api/auth/csrf?context=widget", { cache: "no-store" });
  const csrf: unknown = await csrfResponse.json();
  if (!isRecord(csrf) || !isRecord(csrf["data"]) || typeof csrf["data"]["csrfToken"] !== "string") return;
  const response = await fetch("/api/auth/assertion/exchange", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf["data"]["csrfToken"], "x-support-context": "widget" }, body: JSON.stringify({ assertion }) });
  setState(response.ok ? "ready" : "error");
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
