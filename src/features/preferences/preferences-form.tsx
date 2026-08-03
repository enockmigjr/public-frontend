"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, publicApi } from "@/lib/api/client";

export function PreferencesForm() {
  const query = useQuery({ queryKey: ["public-preferences"], queryFn: publicApi.preferences });
  if (query.isLoading) return <LoadingState />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => query.refetch()} />;
  const data = query.data?.data;
  return <PreferencesEditor initialDisplayName={typeof data?.displayName === "string" ? data.displayName : ""} initialLocale={data?.locale ?? "fr"} />;
}

function PreferencesEditor({ initialDisplayName, initialLocale }: { readonly initialDisplayName: string; readonly initialLocale: string }) {
  const client = useQueryClient();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [locale, setLocale] = useState(initialLocale);
  const [intentKey, setIntentKey] = useState(() => crypto.randomUUID());
  const save = useMutation({ mutationFn: () => publicApi.updatePreferences({ displayName: displayName.trim() || undefined, locale }, intentKey), onSuccess: async () => { setIntentKey(crypto.randomUUID()); await client.invalidateQueries({ queryKey: ["public-preferences"] }); } });
  return <Card className="max-w-2xl"><CardHeader><CardTitle>Informations affichées au support</CardTitle></CardHeader><CardContent><form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} className="space-y-5"><div className="space-y-2"><Label htmlFor="displayName">Nom d’usage</Label><Input id="displayName" value={displayName} maxLength={160} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex. Awa K." /><p className="text-xs text-muted-foreground">Utilisé pour personnaliser les échanges. Il ne remplace pas votre contact vérifié.</p></div><div className="space-y-2"><Label htmlFor="locale">Langue des échanges</Label><select id="locale" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={locale} onChange={(event) => setLocale(event.target.value)}><option value="fr">Français</option><option value="en">English</option></select></div>{save.error && <Alert variant="destructive"><AlertDescription>{save.error instanceof ApiError ? save.error.message : "Les préférences n’ont pas été enregistrées."}</AlertDescription></Alert>}{save.isSuccess && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Préférences enregistrées.</p>}<Button disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer"}</Button></form></CardContent></Card>;
}
