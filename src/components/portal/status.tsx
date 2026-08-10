import { Badge } from "@/components/ui/badge";
import type { PublicTicket } from "@/lib/api/client";

type Status = PublicTicket["status"];
const labels: Record<Status, string> = {
  RECEIVED: "Reçue",
  IN_PROGRESS: "En cours",
  WAITING_FOR_CUSTOMER: "Votre réponse attendue",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

export function StatusBadge({ status }: { readonly status: Status }) {
  const tone = status === "WAITING_FOR_CUSTOMER" ? "bg-amber-100 text-amber-900" : status === "RESOLVED" || status === "CLOSED" ? "bg-emerald-100 text-emerald-900" : "bg-blue-100 text-blue-900";
  return <Badge className={tone}>{labels[status]}</Badge>;
}

export function statusLabel(status?: Status) {
  return status ? labels[status] : "Mise à jour";
}
