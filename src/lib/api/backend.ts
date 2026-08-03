import "server-only";

import { serverEnv } from "@/lib/auth/env";

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const target = new URL(path, serverEnv().BACKEND_URL);
  return fetch(target, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(20_000),
  });
}

export async function backendJson(path: string, method: string, body?: unknown, headers?: HeadersInit) {
  return backendFetch(path, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function safeJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}
