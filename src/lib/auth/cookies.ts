import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { SupportContext } from "./support-context";

export type CookieKind = "session" | "device" | "csrf" | "integration";

export interface PublicSessionTokens {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly trustedDeviceToken: string;
  readonly trustedDeviceExpiresAt: string;
}

export function readCookie(request: NextRequest, context: SupportContext, kind: CookieKind): string | undefined {
  return request.cookies.get(cookieName(context, kind))?.value;
}

export function setSessionCookies(
  response: NextResponse,
  context: SupportContext,
  tokens: PublicSessionTokens,
): void {
  response.cookies.set(cookieName(context, "session"), tokens.accessToken, {
    ...cookieOptions(context),
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(cookieName(context, "device"), tokens.trustedDeviceToken, {
    ...cookieOptions(context),
    expires: new Date(tokens.trustedDeviceExpiresAt),
  });
}

export function setCsrfSeed(response: NextResponse, context: SupportContext, seed: string): void {
  response.cookies.set(cookieName(context, "csrf"), seed, {
    ...cookieOptions(context),
    maxAge: 86_400,
  });
}

export function setIntegrationCookie(response: NextResponse, context: SupportContext, integrationKey: string): void {
  response.cookies.set(cookieName(context, "integration"), integrationKey, {
    ...cookieOptions(context),
    maxAge: 86_400,
  });
}

export function clearSessionCookies(response: NextResponse, context: SupportContext): void {
  for (const kind of ["session", "device"] as const) {
    response.cookies.set(cookieName(context, kind), "", { ...cookieOptions(context), maxAge: 0 });
  }
}

function cookieName(context: SupportContext, kind: CookieKind): string {
  return cookieNameFor(context, kind, isProduction());
}

export function cookieNameFor(context: SupportContext, kind: CookieKind, production: boolean): string {
  const securePrefix = production ? "__Host-" : "";
  const scope = context === "widget" ? "support_iframe" : "support";
  return `${securePrefix}${scope}_${kind}`;
}

function cookieOptions(context: SupportContext) {
  return cookieOptionsFor(context, isProduction());
}

export function cookieOptionsFor(context: SupportContext, production: boolean) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: context === "widget" && production ? "none" : "lax",
    partitioned: context === "widget" && production,
    path: "/",
    priority: "high",
  } as const;
}

function isProduction(): boolean {
  if (process.env["PUBLIC_COOKIE_SECURE"] === "true") return true;
  if (process.env["PUBLIC_COOKIE_SECURE"] === "false") return false;
  return process.env["NODE_ENV"] === "production";
}
