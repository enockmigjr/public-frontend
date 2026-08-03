"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  }));
  useEffect(() => {
    const expired = () => {
      client.clear();
      router.replace("/?session=expired");
    };
    window.addEventListener("public-session-expired", expired);
    return () => window.removeEventListener("public-session-expired", expired);
  }, [client, router]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
