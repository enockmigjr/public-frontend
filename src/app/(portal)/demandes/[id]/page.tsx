import { TicketDetail } from "@/features/requests/ticket-detail";

export default async function TicketDetailPage({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;
  return <TicketDetail ticketId={id} />;
}
