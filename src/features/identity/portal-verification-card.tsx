"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/portal/page-state";
import { VerificationCard } from "./verification-card";

export function PortalVerificationCard({ integrationKey }: { readonly integrationKey?: string }) {
  const configuration = useQuery({
    queryKey: ["portal-integration", integrationKey],
    queryFn: async () => {
      const query = new URLSearchParams({ context: "portal", integrationKey: integrationKey ?? "" });
      const response = await fetch(`/api/config?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Cette intégration de support n’est pas disponible.");
      return true;
    },
    enabled: Boolean(integrationKey),
    retry: false,
  });

  if (configuration.isLoading) return <LoadingState label="Préparation du support…" />;
  if (configuration.error) {
    return <ErrorState message={configuration.error.message} retry={() => configuration.refetch()} />;
  }
  return <VerificationCard />;
}
