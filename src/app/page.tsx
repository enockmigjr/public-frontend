import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/portal/brand";
import { PortalVerificationCard } from "@/features/identity/portal-verification-card";

interface Props {
  readonly searchParams: Promise<{ readonly integrationKey?: string }>;
}

const features = [
  { icon: ShieldCheck, title: "Contact vérifié", text: "Un code envoyé par email, sans compte ni mot de passe." },
  { icon: Clock3, title: "Suivi transparent", text: "Chaque étape de votre demande, visible en temps réel." },
  { icon: CheckCircle2, title: "Données protégées", text: "Échanges sécurisés entre vous et l'équipe support." },
] as const;

export default async function Home({ searchParams }: Props) {
  const { integrationKey } = await searchParams;
  return (
    <main className="min-h-dvh overflow-x-clip bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:h-16 sm:px-8 lg:px-12">
          <Brand />
          <span className="hidden text-xs text-muted-foreground sm:block">Support client sécurisé — sans compte requis</span>
        </div>
      </header>
      <div className="grid w-full items-start gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:gap-20 lg:px-12 lg:py-20 xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="min-w-0 lg:pt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Support client sécurisé</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Signalez un incident. Suivez sa résolution sans friction.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Un espace unique pour transmettre les informations utiles, échanger avec nos équipes et suivre chaque étape de votre demande.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-5xl">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border bg-card p-4">
                <span className="mb-3 grid size-9 place-items-center rounded-lg bg-muted text-foreground"><Icon className="size-4" /></span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="min-w-0 w-full max-w-full lg:justify-self-end">
          <PortalVerificationCard integrationKey={integrationKey} />
        </div>
      </div>
    </main>
  );
}
