import { NextRequest, NextResponse } from "next/server";
import { createCsrf } from "@/lib/auth/csrf";
import { setCsrfSeed } from "@/lib/auth/cookies";
import { supportContext } from "@/lib/auth/support-context";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest): NextResponse {
  const context = supportContext(request.nextUrl.searchParams.get("context"));
  const csrf = createCsrf(request, context);
  const response = NextResponse.json(
    { success: true, data: { csrfToken: csrf.token } },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (csrf.seed) setCsrfSeed(response, context, csrf.seed);
  return response;
}
