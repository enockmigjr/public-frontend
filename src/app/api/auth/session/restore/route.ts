import { NextRequest } from "next/server";
import { backendJson, safeJson } from "@/lib/api/backend";
import { csrfError, gatewayError, noStoreJson, unauthorized } from "@/lib/api/responses";
import { clearSessionCookies, readCookie, setSessionCookies } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { serverEnv } from "@/lib/auth/env";
import { supportContext } from "@/lib/auth/support-context";
import { parseSessionResponse } from "@/lib/api/session-response";

export async function POST(request: NextRequest) {
  const context = supportContext(request.headers.get("x-support-context"));
  if (!verifyCsrf(request, context)) return csrfError();
  const device = readCookie(request, context, "device");
  const integrationKey = readCookie(request, context, "integration") ?? serverEnv().PUBLIC_SUPPORT_INTEGRATION_KEY;
  if (!device) return unauthorized();
  try {
    const upstream = await backendJson("/api/v1/public-support/session/restore", "POST", undefined, {
      "x-integration-key": integrationKey,
      "x-trusted-device": device,
    });
    const payload = await safeJson(upstream);
    const parsed = parseSessionResponse(payload);
    if (!upstream.ok || !parsed.success) {
      const response = noStoreJson(payload, upstream.status);
      if (upstream.status === 401) clearSessionCookies(response, context);
      return response;
    }
    const response = noStoreJson({ success: true, data: { restored: true } });
    setSessionCookies(response, context, parsed.data.data);
    return response;
  } catch {
    return gatewayError();
  }
}
