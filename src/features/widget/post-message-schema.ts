import { z } from "zod";

export const hostMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("IDENTITY_ASSERTION"), assertion: z.string().min(80).max(8192) }),
]);

export const widgetMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("READY") }),
  z.object({ type: z.literal("RESIZE"), height: z.number().int().min(320).max(760) }),
  z.object({ type: z.literal("OPEN_PORTAL") }),
  z.object({ type: z.literal("IDENTITY_ACCEPTED") }),
]);

export type HostMessage = z.infer<typeof hostMessageSchema>;
export type WidgetMessage = z.infer<typeof widgetMessageSchema>;
