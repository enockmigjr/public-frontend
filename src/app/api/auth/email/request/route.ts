import { NextRequest } from "next/server";
import { z } from "zod";
import { backendJson, safeJson } from "@/lib/api/backend";
import { bffError, csrfError, gatewayError, noStoreJson } from "@/lib/api/responses";
import { verifyCsrf } from "@/lib/auth/csrf";
import { serverEnv } from "@/lib/auth/env";
import { readCookie } from "@/lib/auth/cookies";
import { parseJson } from "@/lib/auth/request-body";
import { supportContext } from "@/lib/auth/support-context";

const requestSchema = z.object({ email: z.email().max(255) });

export async function POST(request: NextRequest) {
  const context = supportContext(request.headers.get("x-support-context"));
  if (!verifyCsrf(request, context)) return csrfError();
  const body = await parseJson(request, requestSchema);
  if (!body) return bffError("VALIDATION_ERROR", "Saisissez une adresse email valide.", 400);
  try {
    const integrationKey = readCookie(request, context, "integration") ?? serverEnv().PUBLIC_SUPPORT_INTEGRATION_KEY;
    const upstream = await backendJson("/api/v1/public-support/identity/email/request", "POST", {
      ...body,
      integrationKey,
    });
    return noStoreJson(await safeJson(upstream), upstream.status);
  } catch {
    return gatewayError();
  }
}
