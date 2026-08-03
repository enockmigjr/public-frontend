import { z } from "zod";

const MAX_JSON_BYTES = 16_384;

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_JSON_BYTES) return null;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_JSON_BYTES) return null;
    const parsed = schema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
