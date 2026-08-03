import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const frameAncestor = request.nextUrl.pathname === "/widget" ? await widgetFrameAncestor(request) : "'none'";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    `frame-ancestors ${frameAncestor}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

async function widgetFrameAncestor(request: NextRequest): Promise<string> {
  const integrationKey = request.nextUrl.searchParams.get("integrationKey");
  const parentOrigin = exactOrigin(request.nextUrl.searchParams.get("parentOrigin"));
  const backendUrl = process.env.BACKEND_URL;
  if (!integrationKey || integrationKey.length < 16 || !parentOrigin || !backendUrl) return "'none'";
  const query = new URLSearchParams({ integrationKey, origin: parentOrigin });
  try {
    const response = await fetch(new URL(`/api/v1/public-support/config?${query}`, backendUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    const payload: unknown = await response.json();
    return response.ok && frameAllowed(payload) ? parentOrigin : "'none'";
  } catch { return "'none'"; }
}

function exactOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin === value && ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch { return null; }
}

function frameAllowed(value: unknown): boolean {
  return isRecord(value) && value["success"] === true && isRecord(value["data"]) && value["data"]["frameAllowed"] === true;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|widget/v1/widget.js).*)"] };
