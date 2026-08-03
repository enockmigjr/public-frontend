import { PageHeading } from "@/components/portal/page-heading";
import { RequestWizard } from "@/features/requests/request-wizard";

export default function NewRequestPage() {
  return <><PageHeading eyebrow="Nouvel incident" title="Créer une demande" description="Donnez-nous les éléments essentiels. Vous relirez et confirmerez vos informations avant l’envoi." /><div className="max-w-3xl"><RequestWizard /></div></>;
}
