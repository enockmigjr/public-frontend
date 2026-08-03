import { z } from "zod";

export const supportContextSchema = z.enum(["portal", "widget"]);
export type SupportContext = z.infer<typeof supportContextSchema>;

export function supportContext(header: string | null): SupportContext {
  return supportContextSchema.catch("portal").parse(header);
}
