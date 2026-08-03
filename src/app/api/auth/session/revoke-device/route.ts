import { NextRequest } from "next/server";
import { backendJson, safeJson } from "@/lib/api/backend";
import { csrfError, gatewayError, noStoreJson, unauthorized } from "@/lib/api/responses";
import { clearSessionCookies, readCookie } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { supportContext } from "@/lib/auth/support-context";

export async function POST(request: NextRequest) {
  const context = supportContext(request.headers.get("x-support-context"));
  if (!verifyCsrf(request, context)) return csrfError();
  const accessToken = readCookie(request, context, "session");
  if (!accessToken) return unauthorized();
  try {
    const upstream = await backendJson("/api/v1/public-support/session/revoke-device", "POST", undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
    const response = noStoreJson(await safeJson(upstream), upstream.status);
    if (upstream.ok || upstream.status === 401) clearSessionCookies(response, context);
    return response;
  } catch {
    return gatewayError();
  }
}
