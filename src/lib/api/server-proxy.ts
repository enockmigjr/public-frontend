import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "./backend";
import { bffError, csrfError, gatewayError, unauthorized } from "./responses";
import { publicRoutePolicy } from "./route-policy";
import { clearSessionCookies, readCookie } from "@/lib/auth/cookies";
import { verifyCsrf } from "@/lib/auth/csrf";
import { supportContext } from "@/lib/auth/support-context";

interface StreamingRequestInit extends RequestInit {
  readonly duplex: "half";
}

export async function proxyPublic(request: NextRequest, segments: readonly string[]): Promise<NextResponse> {
  const policy = publicRoutePolicy(request.method, segments);
  if (!policy) return bffError("ROUTE_NOT_ALLOWED", "Cette opération publique n’est pas disponible.", 404);
  const context = supportContext(request.headers.get("x-support-context"));
  if (request.method !== "GET" && !verifyCsrf(request, context)) return csrfError();
  const accessToken = readCookie(request, context, "session");
  if (!accessToken) return unauthorized();
  const idempotency = request.headers.get("idempotency-key");
  if (policy.idempotency === "required" && !idempotency) {
    return bffError("IDEMPOTENCY_REQUIRED", "Une clé de sécurité est requise pour cette action.", 400);
  }
  if (!validContentType(request, policy.body)) {
    return bffError("CONTENT_TYPE_INVALID", "Le format de la requête est invalide.", 415);
  }
  try {
    const headers = upstreamHeaders(request, accessToken, idempotency);
    const path = `/api/v1/public-support/${segments.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
    const init: StreamingRequestInit = {
      method: request.method,
      headers,
      body: policy.body === "none" ? undefined : request.body,
      cache: "no-store",
      duplex: "half",
      signal: AbortSignal.timeout(policy.body === "multipart" ? 120_000 : 20_000),
    };
    const upstream = await backendFetch(path, init);
    const response = streamResponse(upstream);
    if (upstream.status === 401) clearSessionCookies(response, context);
    return response;
  } catch {
    return gatewayError();
  }
}

function upstreamHeaders(request: NextRequest, accessToken: string, idempotency: string | null): Headers {
  const headers = new Headers({ Authorization: `Bearer ${accessToken}`, Accept: request.headers.get("accept") ?? "*/*" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (idempotency) headers.set("Idempotency-Key", idempotency);
  return headers;
}

function validContentType(request: NextRequest, body: "none" | "json" | "multipart"): boolean {
  if (body === "none") return true;
  const value = request.headers.get("content-type") ?? "";
  return body === "json" ? value.startsWith("application/json") : value.startsWith("multipart/form-data;");
}

function streamResponse(upstream: Response): NextResponse {
  const headers = new Headers({ "Cache-Control": "private, no-store" });
  for (const name of ["content-type", "content-disposition", "content-length", "x-correlation-id"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
