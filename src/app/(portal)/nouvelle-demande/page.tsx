import { PageHeading } from "@/components/portal/page-heading";
import { AssistantPanel } from "@/features/conversation/assistant-panel";
import { RequestWizard } from "@/features/requests/request-wizard";

interface Props { readonly searchParams: Promise<{ readonly conversation?: string }> }

export default async function NewRequestPage({ searchParams }: Props) {
  const { conversation } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="Nouvel incident" title="Créer une demande" description="Posez une question à l’assistant ou remplissez directement le formulaire : les deux chemins restent disponibles." />
      <div className="max-w-3xl">
        <AssistantPanel />
        <div id="formulaire" className="scroll-mt-24">
          <RequestWizard resumeId={conversation} />
        </div>
      </div>
    </>
  );
}
