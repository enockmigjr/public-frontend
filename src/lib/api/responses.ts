import { NextResponse } from "next/server";

export function noStoreJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function bffError(code: string, message: string, status: number): NextResponse {
  return noStoreJson({ success: false, error: { code, message } }, status);
}

export const csrfError = () => bffError("CSRF_INVALID", "La protection de la requête a expiré.", 403);
export const gatewayError = () => bffError("UPSTREAM_UNAVAILABLE", "Le support est momentanément indisponible.", 503);
export const unauthorized = () => bffError("PUBLIC_SESSION_REQUIRED", "Vérifiez votre contact pour continuer.", 401);
