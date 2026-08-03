import { z } from "zod";

const sessionData = z.object({
  verified: z.boolean().optional(),
  accessToken: z.string().min(20),
  expiresIn: z.number().int().min(1).max(3600),
  trustedDeviceToken: z.string().min(20),
  trustedDeviceExpiresAt: z.iso.datetime(),
});

const sessionEnvelope = z.object({ success: z.literal(true), data: sessionData });

export function parseSessionResponse(value: unknown) {
  return sessionEnvelope.safeParse(value);
}
