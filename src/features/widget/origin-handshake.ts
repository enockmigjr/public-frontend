"use client";

import { hostMessageSchema, WidgetMessage } from "./post-message-schema";

export function postToHost(origin: string, message: WidgetMessage): void {
  if (window.parent === window) return;
  window.parent.postMessage(message, origin);
}

export function listenToHost(origin: string, onAssertion: (assertion: string) => void): () => void {
  const listener = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== window.parent) return;
    const parsed = hostMessageSchema.safeParse(event.data);
    if (parsed.success) onAssertion(parsed.data.assertion);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
