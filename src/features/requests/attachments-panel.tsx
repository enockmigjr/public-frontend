"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, File, Paperclip, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, publicApi } from "@/lib/api/client";
import { usePublicRealtime } from "@/features/realtime/public-realtime-provider";

const labels = { NOT_REQUIRED: "Disponible", QUARANTINED: "En attente", PENDING: "Analyse planifiée", SCANNING: "Analyse en cours", CLEAN: "Sain", INFECTED: "Bloqué", ERROR: "Échec de l’analyse" } as const;
const size = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);
const maxFileSize = 10 * 1024 * 1024;

export function AttachmentsPanel({ ticketId }: { readonly ticketId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const realtime = usePublicRealtime();
  const [fileError, setFileError] = useState<string>();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["public-attachments", ticketId], queryFn: () => publicApi.attachments(ticketId), refetchInterval: (state) => state.state.data?.data.some((item) => !["CLEAN", "INFECTED", "ERROR", "NOT_REQUIRED"].includes(item.scanStatus)) && realtime !== "connected" ? 5_000 : false });
  const upload = useMutation({ mutationFn: ({ file, key }: { readonly file: File; readonly key: string }) => publicApi.upload(ticketId, file, key), onSuccess: async () => client.invalidateQueries({ queryKey: ["public-attachments", ticketId] }) });
  return <section className="rounded-xl border bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Pièces jointes</h2><p className="mt-1 text-xs text-muted-foreground">PDF, image ou texte, jusqu’à 10 Mo. Chaque fichier est analysé.</p></div><input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; setFileError(undefined); if (file && file.size > maxFileSize) setFileError("Le fichier dépasse la limite de 10 Mo."); else if (file && !allowedTypes.has(file.type)) setFileError("Ce type de fichier n’est pas autorisé."); else if (file) upload.mutate({ file, key: crypto.randomUUID() }); event.target.value = ""; }} /><Button type="button" variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}><Paperclip />{upload.isPending ? "Envoi…" : "Ajouter"}</Button></div>
    {fileError && <Alert variant="destructive" className="mt-3"><AlertDescription>{fileError}</AlertDescription></Alert>}
    {upload.error && <Alert variant="destructive" className="mt-3"><AlertDescription>{upload.error instanceof ApiError ? upload.error.message : "Le fichier n’a pas été envoyé."}</AlertDescription></Alert>}
    <div className="mt-4 space-y-2">{query.isLoading && <p className="text-sm text-muted-foreground">Chargement des fichiers…</p>}{query.error && <p className="text-sm text-destructive">Impossible de charger les fichiers.</p>}{query.data?.data.length === 0 && <p className="rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">Aucun fichier joint.</p>}{query.data?.data.map((attachment) => <div key={attachment.id} className="flex items-center gap-3 rounded-lg border p-3"><span className="grid size-9 place-items-center rounded-lg bg-slate-100"><File className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{attachment.filename}</p><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span>{size(attachment.fileSize)}</span><Badge variant="outline" className="text-[10px]">{labels[attachment.scanStatus]}</Badge></div></div>{attachment.scanStatus === "CLEAN" && <a aria-label={`Télécharger ${attachment.filename}`} href={`/api/public/tickets/${ticketId}/attachments/${attachment.id}/download`} className="grid size-8 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Download className="size-4" /></a>}</div>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />Ne transmettez pas de mots de passe ni de données bancaires.</p>
  </section>;
}
