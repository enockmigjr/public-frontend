import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { serverEnv } from "./env";
import { readCookie } from "./cookies";
import { SupportContext } from "./support-context";

export function createCsrf(request: NextRequest, context: SupportContext): { token: string; seed?: string } {
  const existing = readCookie(request, context, "session") ?? readCookie(request, context, "csrf");
  const binding = existing ?? randomBytes(32).toString("base64url");
  return { token: signature(context, binding), ...(existing ? {} : { seed: binding }) };
}

export function verifyCsrf(request: NextRequest, context: SupportContext): boolean {
  const provided = request.headers.get("x-csrf-token");
  const binding = readCookie(request, context, "session") ?? readCookie(request, context, "csrf");
  if (!provided || !binding) return false;
  const expected = signature(context, binding);
  const actualBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function signature(context: SupportContext, binding: string): string {
  return createHmac("sha256", serverEnv().PUBLIC_BFF_CSRF_SECRET)
    .update(`${context}:${binding}`)
    .digest("base64url");
}
