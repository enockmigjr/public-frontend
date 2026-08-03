"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LifeBuoy, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationCard } from "@/features/identity/verification-card";
import { widgetApi } from "@/lib/api/client";
import { openFullPage } from "./full-page-fallback";
import { listenToHost, postToHost } from "./origin-handshake";
import { WidgetPortal } from "./widget-portal";

interface Props { readonly integrationKey: string; readonly parentOrigin: string }

export function WidgetShell({ integrationKey, parentOrigin }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "blocked" | "error">("loading");
  const [authenticated, setAuthenticated] = useState(false);

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
    return listenToHost(parentOrigin, (assertion) => void exchangeAssertion(assertion).then((accepted) => {
      if (accepted) {
        setAuthenticated(true);
        postToHost(parentOrigin, { type: "IDENTITY_ACCEPTED" });
      }
    }).catch(() => setAuthenticated(false)));
  }, [integrationKey, parentOrigin]);

  useEffect(() => {
    if (state === "ready") postToHost(parentOrigin, { type: "RESIZE", height: authenticated ? 700 : 620 });
  }, [authenticated, parentOrigin, state]);

  if (state === "loading") return <StatePanel icon={<LoaderCircle className="size-5 animate-spin" />} text="Ouverture du support…" />;
  if (state === "blocked") return <StatePanel icon={<ShieldCheck className="size-5" />} text="Ce site n’est pas autorisé à afficher ce support." />;
  if (state === "error") return <StatePanel icon={<LifeBuoy className="size-5" />} text="Le support est temporairement indisponible." />;
  return <main className="flex min-h-dvh flex-col bg-background p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><LifeBuoy /></span>
        <div><p className="font-semibold">Assistance</p><p className="text-xs text-muted-foreground">Canal sécurisé</p></div>
      </div>
      <div className="min-h-0 flex-1">{authenticated ? <WidgetPortal onOpenPortal={() => void openFullPage(integrationKey)} onSessionExpired={() => setAuthenticated(false)} /> : <VerificationCard api={widgetApi} onVerified={() => setAuthenticated(true)} />}</div>
      <Button variant="ghost" size="sm" className="mt-3 self-center" onClick={() => void openFullPage(integrationKey)}>Ouvrir le portail complet <ExternalLink /></Button>
      <p className="mt-1 text-center text-[11px] text-muted-foreground"><ShieldCheck className="mr-1 inline size-3" />Fallback disponible si les cookies tiers sont bloqués.</p>
    </main>;
}

function StatePanel({ icon, text }: { readonly icon: React.ReactNode; readonly text: string }) {
  return <main className="grid min-h-dvh place-items-center bg-background p-6"><div className="flex max-w-xs items-center gap-3 text-sm text-muted-foreground">{icon}<p>{text}</p></div></main>;
}

function isFrameAllowed(value: unknown): boolean {
  return isRecord(value) && value["success"] === true && isRecord(value["data"]) && value["data"]["frameAllowed"] === true;
}

async function exchangeAssertion(assertion: string): Promise<boolean> {
  try {
    const csrfResponse = await fetch("/api/auth/csrf?context=widget", { cache: "no-store" });
    const csrf: unknown = await csrfResponse.json();
    if (!isRecord(csrf) || !isRecord(csrf["data"]) || typeof csrf["data"]["csrfToken"] !== "string") return false;
    const response = await fetch("/api/auth/assertion/exchange", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf["data"]["csrfToken"], "x-support-context": "widget" }, body: JSON.stringify({ assertion }) });
    return response.ok;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
