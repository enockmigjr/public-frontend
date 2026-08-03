import { z } from "zod";

export const publicRefreshSchema = z.object({
  resource: z.enum(["ticket", "conversation", "attachment"]),
  id: z.uuid(),
});

export type PublicRefresh = z.infer<typeof publicRefreshSchema>;

export function realtimeQueryKeys(event: PublicRefresh): ReadonlyArray<readonly string[]> {
  if (event.resource === "conversation") return [["public-conversation", event.id]];
  if (event.resource === "attachment") return [["public-attachments"]];
  return [
    ["public-tickets"],
    ["public-ticket", event.id],
    ["public-timeline", event.id],
    ["public-attachments", event.id],
    ["widget-tickets"],
    ["widget-ticket", event.id],
    ["widget-timeline", event.id],
  ];
}

export function publicPollingInterval(state: "connecting" | "connected" | "polling", failures: number): number | false {
  if (state === "connected") return false;
  if (state === "connecting") return 15_000;
  return Math.min(60_000, 15_000 * 2 ** Math.min(failures, 2));
}
