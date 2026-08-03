import { NextRequest } from "next/server";
import { z } from "zod";
import { backendJson, safeJson } from "@/lib/api/backend";
import { bffError, csrfError, gatewayError, noStoreJson } from "@/lib/api/responses";
import { setSessionCookies } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { parseJson } from "@/lib/auth/request-body";
import { supportContext } from "@/lib/auth/support-context";
import { parseSessionResponse } from "@/lib/api/session-response";

const assertionSchema = z.object({ assertion: z.string().min(80).max(8192) });

export async function POST(request: NextRequest) {
  const context = supportContext(request.headers.get("x-support-context"));
  if (!verifyCsrf(request, context)) return csrfError();
  const body = await parseJson(request, assertionSchema);
  if (!body) return bffError("ASSERTION_INVALID", "L’identité transmise est invalide.", 400);
  try {
    const upstream = await backendJson("/api/v1/public-support/identity/assertion/exchange", "POST", undefined, {
      Authorization: `Bearer ${body.assertion}`,
    });
    const payload = await safeJson(upstream);
    const parsed = parseSessionResponse(payload);
    if (!upstream.ok || !parsed.success) return noStoreJson(payload, upstream.status);
    const response = noStoreJson({ success: true, data: { verified: true } });
    setSessionCookies(response, context, parsed.data.data);
    return response;
  } catch {
    return gatewayError();
  }
}
