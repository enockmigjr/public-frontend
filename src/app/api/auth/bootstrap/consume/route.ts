import { NextRequest } from "next/server";
import { z } from "zod";
import { backendJson, safeJson } from "@/lib/api/backend";
import { bffError, csrfError, gatewayError, noStoreJson } from "@/lib/api/responses";
import { setSessionCookies } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { parseJson } from "@/lib/auth/request-body";
import { parseSessionResponse } from "@/lib/api/session-response";

const bootstrapSchema = z.object({ code: z.string().min(32).max(128) });

export async function POST(request: NextRequest) {
  if (!verifyCsrf(request, "portal")) return csrfError();
  const body = await parseJson(request, bootstrapSchema);
  if (!body) return bffError("BOOTSTRAP_INVALID", "Le lien de reprise est invalide.", 400);
  try {
    const upstream = await backendJson("/api/v1/public-support/session/bootstrap/consume", "POST", body);
    const payload = await safeJson(upstream);
    const parsed = parseSessionResponse(payload);
    if (!upstream.ok || !parsed.success) return noStoreJson(payload, upstream.status);
    const response = noStoreJson({ success: true, data: { restored: true } });
    setSessionCookies(response, "portal", parsed.data.data);
    return response;
  } catch {
    return gatewayError();
  }
}
