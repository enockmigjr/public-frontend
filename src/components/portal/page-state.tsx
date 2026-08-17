"use client";

import { AlertCircle, Inbox, LoaderCircle, WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Chargement…" }: { readonly label?: string }) {
  return <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center gap-2.5 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{label}</div>;
}

export function EmptyState({ title, description }: { readonly title: string; readonly description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-10 text-center"><Inbox className="mb-3 size-8 text-muted-foreground" /><h2 className="font-semibold tracking-tight">{title}</h2><p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

export function ErrorState({ message, retry }: { readonly message: string; readonly retry?: () => void }) {
  return <Alert variant="destructive"><AlertCircle /><AlertTitle>Impossible de charger ces informations</AlertTitle><AlertDescription className="flex items-center justify-between gap-4"><span>{message}</span>{retry && <Button variant="outline" size="sm" onClick={retry}>Réessayer</Button>}</AlertDescription></Alert>;
}

export function OfflineNotice() {
  const online = useSyncExternalStore(subscribeToNetwork, () => navigator.onLine, () => true);
  if (online) return null;
  return <div role="status" aria-live="polite" className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-950"><WifiOff className="size-4" />Connexion interrompue. Vos données seront actualisées au retour du réseau.</div>;
}

function subscribeToNetwork(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => { window.removeEventListener("online", callback); window.removeEventListener("offline", callback); };
}
