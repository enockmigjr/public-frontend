import { NextRequest } from "next/server";
import { proxyPublic } from "@/lib/api/server-proxy";

interface Context {
  readonly params: Promise<{ readonly path: readonly string[] }>;
}

async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyPublic(request, path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
