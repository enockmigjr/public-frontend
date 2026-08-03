import { NextRequest } from "next/server";
import { z } from "zod";
import { backendJson, safeJson } from "@/lib/api/backend";
import { bffError, csrfError, gatewayError, noStoreJson } from "@/lib/api/responses";
import { setSessionCookies } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { parseJson } from "@/lib/auth/request-body";
import { supportContext } from "@/lib/auth/support-context";
import { parseSessionResponse } from "@/lib/api/session-response";

const consumeSchema = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: NextRequest) {
  const context = supportContext(request.headers.get("x-support-context"));
  if (!verifyCsrf(request, context)) return csrfError();
  const body = await parseJson(request, consumeSchema);
  if (!body) return bffError("VALIDATION_ERROR", "Le code de vérification est invalide.", 400);
  try {
    const upstream = await backendJson("/api/v1/public-support/identity/email/consume", "POST", body);
    const payload = await safeJson(upstream);
    if (!upstream.ok) return noStoreJson(payload, upstream.status);
    const parsed = parseSessionResponse(payload);
    if (!parsed.success) return noStoreJson(payload, upstream.status);
    const response = noStoreJson({ success: true, data: { verified: parsed.data.data.verified === true } });
    setSessionCookies(response, context, parsed.data.data);
    return response;
  } catch {
    return gatewayError();
  }
}
