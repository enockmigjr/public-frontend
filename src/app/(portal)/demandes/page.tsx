import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/portal/page-heading";
import { TicketList } from "@/features/requests/ticket-list";

export default function TicketsPage() {
  return <><PageHeading eyebrow="Suivi" title="Mes demandes" description="Retrouvez vos incidents, leur état public et les échanges avec l’équipe support." action={<Link href="/nouvelle-demande" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" />Nouvelle demande</Link>} /><TicketList /></>;
}
