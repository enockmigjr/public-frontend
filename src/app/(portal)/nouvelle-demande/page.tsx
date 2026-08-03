import { PageHeading } from "@/components/portal/page-heading";
import { RequestWizard } from "@/features/requests/request-wizard";

interface Props { readonly searchParams: Promise<{ readonly conversation?: string }> }

export default async function NewRequestPage({ searchParams }: Props) {
  const { conversation } = await searchParams;
  return <><PageHeading eyebrow="Nouvel incident" title="Créer une demande" description="Donnez-nous les éléments essentiels. Vous relirez et confirmerez vos informations avant l’envoi." /><div className="max-w-3xl"><RequestWizard resumeId={conversation} /></div></>;
}
