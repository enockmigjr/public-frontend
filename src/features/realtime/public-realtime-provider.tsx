"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io } from "socket.io-client";
import { publicRefreshSchema, realtimeQueryKeys } from "./public-realtime";

type RealtimeState = "connecting" | "connected" | "polling";

const RealtimeContext = createContext<RealtimeState>("connecting");

export function PublicRealtimeProvider({ children, context }: { readonly children: ReactNode; readonly context: "portal" | "widget" }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<RealtimeState>("connecting");
  const socket = useMemo(() => io("/public-support", {
    path: "/socket.io",
    autoConnect: false,
    auth: { context },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10_000,
  }), [context]);

  useEffect(() => {
    const connected = () => {
      setState("connected");
      for (const queryKey of [["public-tickets"], ["public-ticket"], ["public-timeline"], ["public-attachments"], ["widget-tickets"], ["widget-ticket"], ["widget-timeline"]]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    };
    const unavailable = () => setState("polling");
    // Repli sans WebSocket (cookies tiers bloqués en iframe, réseau, etc.) :
    // rafraîchit périodiquement pour que les réponses apparaissent sans rechargement.
    const polling = window.setInterval(() => {
      if (socket.connected) return;
      for (const queryKey of [["public-tickets"], ["public-ticket"], ["public-timeline"], ["public-attachments"], ["widget-tickets"], ["widget-ticket"], ["widget-timeline"]]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }, 30_000);
    const refresh = (value: unknown) => {
      const event = publicRefreshSchema.safeParse(value);
      if (!event.success) return;
      for (const queryKey of realtimeQueryKeys(event.data)) void queryClient.invalidateQueries({ queryKey });
    };
    socket.on("connect", connected);
    socket.on("disconnect", unavailable);
    socket.on("connect_error", unavailable);
    socket.on("public.refresh", refresh);
    socket.connect();
    return () => {
      socket.off("connect", connected);
      socket.off("disconnect", unavailable);
      socket.off("connect_error", unavailable);
      socket.off("public.refresh", refresh);
      socket.disconnect();
      window.clearInterval(polling);
    };
  }, [queryClient, socket]);

  return <RealtimeContext value={state}>{children}</RealtimeContext>;
}

export function usePublicRealtime(): RealtimeState {
  return useContext(RealtimeContext);
}
