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
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Brand />
          <span className="hidden text-xs text-muted-foreground sm:block">Support client sécurisé — sans compte requis</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:py-16">
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Support client sécurisé</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Signalez un incident. Suivez sa résolution sans friction.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Un espace unique pour transmettre les informations utiles, échanger avec nos équipes et suivre chaque étape de votre demande.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border bg-white p-4">
                <span className="mb-3 grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon className="size-4" /></span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <PortalVerificationCard integrationKey={integrationKey} />
        </div>
      </div>
    </main>
  );
}
