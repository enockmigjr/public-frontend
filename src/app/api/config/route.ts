import { NextRequest } from "next/server";
import { z } from "zod";
import { backendJson, safeJson } from "@/lib/api/backend";
import { bffError, gatewayError, noStoreJson } from "@/lib/api/responses";
import { setIntegrationCookie } from "@/lib/auth/cookies";
import { serverEnv } from "@/lib/auth/env";
import { supportContext } from "@/lib/auth/support-context";

const querySchema = z.object({
  integrationKey: z.string().min(16).max(80).optional(),
  origin: z.url().max(2048).optional(),
});

export async function GET(request: NextRequest) {
  const context = supportContext(request.nextUrl.searchParams.get("context"));
  const parsed = querySchema.safeParse({
    integrationKey: request.nextUrl.searchParams.get("integrationKey") ?? undefined,
    origin: request.nextUrl.searchParams.get("origin") ?? undefined,
  });
  if (!parsed.success) return bffError("CONFIG_INVALID", "La configuration du support est invalide.", 400);
  const integrationKey = parsed.data.integrationKey ?? serverEnv().PUBLIC_SUPPORT_INTEGRATION_KEY;
  const query = new URLSearchParams({ integrationKey });
  if (parsed.data.origin) query.set("origin", parsed.data.origin);
  try {
    const upstream = await backendJson(`/api/v1/public-support/config?${query}`, "GET");
    const payload = await safeJson(upstream);
    const response = noStoreJson(payload, upstream.status);
    if (upstream.ok) setIntegrationCookie(response, context, integrationKey);
    return response;
  } catch {
    return gatewayError();
  }
}
