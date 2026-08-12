import { SatisfactionPage } from "@/features/satisfaction/satisfaction-page";

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<{ t?: string; id?: string }> }>) {
  const { t, id } = await searchParams;
  return <SatisfactionPage token={t ?? ""} ticketId={id ?? ""} />;
}
