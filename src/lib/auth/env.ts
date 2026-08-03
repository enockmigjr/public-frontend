import "server-only";

import { z } from "zod";

const schema = z.object({
  BACKEND_URL: z.url(),
  PUBLIC_SUPPORT_INTEGRATION_KEY: z.string().min(16).max(80),
  PUBLIC_BFF_CSRF_SECRET: z.string().min(32),
});

let cached: z.infer<typeof schema> | undefined;

export function serverEnv(): z.infer<typeof schema> {
  cached ??= schema.parse({
    BACKEND_URL: process.env.BACKEND_URL,
    PUBLIC_SUPPORT_INTEGRATION_KEY: process.env.PUBLIC_SUPPORT_INTEGRATION_KEY,
    PUBLIC_BFF_CSRF_SECRET: process.env.PUBLIC_BFF_CSRF_SECRET,
  });
  return cached;
}
