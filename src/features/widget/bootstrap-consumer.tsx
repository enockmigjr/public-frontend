"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function BootstrapConsumer() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    void consumeFragment().then((ok) => {
      if (ok) router.replace("/demandes");
      else setError(true);
    });
  }, [router]);

  if (!error) {
    return <main className="grid min-h-dvh place-items-center p-6"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /><p>Reprise sécurisée de votre session…</p></div></main>;
  }
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-items-center p-6">
      <Alert variant="destructive"><CircleAlert /><AlertTitle>Lien expiré ou déjà utilisé</AlertTitle><AlertDescription>Votre demande n’a pas été modifiée. Vérifiez à nouveau votre contact pour continuer.</AlertDescription></Alert>
      <Button className="mt-4" onClick={() => router.replace("/")}>Revenir à la vérification</Button>
    </main>
  );
}

async function consumeFragment(): Promise<boolean> {
  const code = window.location.hash.slice(1);
  history.replaceState(null, "", window.location.pathname);
  if (code.length < 32 || code.length > 128) return false;
  return consume(code);
}

async function consume(code: string): Promise<boolean> {
  const csrfResponse = await fetch("/api/auth/csrf?context=portal", { cache: "no-store" });
  const csrf: unknown = await csrfResponse.json();
  if (!isRecord(csrf) || !isRecord(csrf["data"]) || typeof csrf["data"]["csrfToken"] !== "string") return false;
  const response = await fetch("/api/auth/bootstrap/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrf["data"]["csrfToken"] },
    body: JSON.stringify({ code }),
  });
  return response.ok;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
