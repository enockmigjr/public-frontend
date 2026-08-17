"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop, ShieldCheck, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publicApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function DeviceList() {
  const client = useQueryClient();
  const router = useRouter();
  const query = useQuery({ queryKey: ["trusted-devices"], queryFn: publicApi.devices });
  const revoke = useMutation({ mutationFn: publicApi.revokeDevice, onSuccess: async () => client.invalidateQueries({ queryKey: ["trusted-devices"] }) });
  const forget = useMutation({ mutationFn: publicApi.forgetCurrentDevice, onSuccess: () => router.replace("/") });
  if (query.isLoading) return <LoadingState />;
  if (query.error) return <ErrorState message={query.error.message} retry={() => query.refetch()} />;
  if (!query.data?.data.length) return <EmptyState title="Aucun appareil reconnu" description="Les appareils que vous choisissez de faire reconnaître apparaîtront ici." />;
  return <div className="space-y-3">{(revoke.error || forget.error) && <Alert variant="destructive"><AlertDescription>La révocation n’a pas abouti. Votre session et vos données restent inchangées.</AlertDescription></Alert>}{query.data.data.map((device) => <Card key={device.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="grid size-11 place-items-center rounded-xl bg-muted"><Laptop className="size-5" /></span><div className="flex-1"><div className="flex items-center gap-2"><strong className="text-sm">Appareil vérifié</strong>{device.current && <Badge className="bg-emerald-100 text-emerald-900">Cet appareil</Badge>}{device.revokedAt && <Badge variant="outline">Révoqué</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">Reconnu le {date.format(new Date(device.createdAt))} · expire le {date.format(new Date(device.expiresAt))}</p></div>{device.current ? <Button variant="destructive" disabled={forget.isPending} onClick={() => forget.mutate()}><Trash2 />Oublier cet appareil</Button> : <Button variant="destructive" disabled={Boolean(device.revokedAt) || revoke.isPending} onClick={() => revoke.mutate(device.id)}><Trash2 />Révoquer</Button>}</CardContent></Card>)}<p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />La révocation empêche une future restauration de session sur cet appareil.</p></div>;
}
