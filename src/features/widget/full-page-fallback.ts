"use client";

import { z } from "zod";

const csrfSchema = z.object({ success: z.literal(true), data: z.object({ csrfToken: z.string().min(20) }) });
const grantSchema = z.object({ success: z.literal(true), data: z.object({ code: z.string().min(32).max(128) }) });

export async function openFullPage(): Promise<void> {
  const csrfResponse = await fetch("/api/auth/csrf?context=widget", { cache: "no-store" });
  const csrf = csrfSchema.safeParse(await responseJson(csrfResponse));
  if (!csrf.success) return openVerification();
  const response = await fetch("/api/public/session/bootstrap/request", {
    method: "POST",
    headers: { "x-csrf-token": csrf.data.data.csrfToken, "x-support-context": "widget" },
  });
  const grant = grantSchema.safeParse(await responseJson(response));
  if (!grant.success) return openVerification();
  const target = new URL("/bootstrap", window.location.origin);
  target.hash = grant.data.data.code;
  window.open(target, "_blank", "noopener,noreferrer");
}

async function responseJson(response: Response): Promise<unknown> {
  if (!response.ok) return null;
  try { return await response.json(); } catch { return null; }
}

function openVerification(): void {
  const target = new URL("/", window.location.origin);
  target.searchParams.set("verify", "1");
  window.open(target, "_blank", "noopener,noreferrer");
}
