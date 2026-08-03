type BodyKind = "none" | "json" | "multipart";

export interface PublicRoutePolicy {
  readonly body: BodyKind;
  readonly idempotency: "required" | "optional" | "none";
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const SAFE_SEGMENT = /^[A-Za-z0-9-]+$/;
const RULES: ReadonlyArray<{ method: string; pattern: RegExp; policy: PublicRoutePolicy }> = [
  rule("GET", "catalog"),
  rule("GET", "preferences"),
  rule("PATCH", "preferences", "json", "required"),
  rule("GET", "tickets"),
  rule("POST", "conversations", "json", "required"),
  rule("GET", `conversations/${UUID}`),
  rule("PATCH", `conversations/${UUID}/draft`, "json", "optional"),
  rule("POST", `conversations/${UUID}/confirm`, "json", "required"),
  rule("POST", `conversations/${UUID}/handoff`, "json", "required"),
  rule("GET", `conversations/${UUID}/attachments`),
  rule("POST", `conversations/${UUID}/attachments`, "multipart", "required"),
  rule("GET", `conversations/${UUID}/attachments/${UUID}/status`),
  rule("GET", `conversations/${UUID}/attachments/${UUID}/download`),
  rule("GET", `tickets/${UUID}`),
  rule("GET", `tickets/${UUID}/timeline`),
  rule("POST", `tickets/${UUID}/comments`, "json", "required"),
  rule("GET", `tickets/${UUID}/attachments`),
  rule("POST", `tickets/${UUID}/attachments`, "multipart", "required"),
  rule("GET", `tickets/${UUID}/attachments/${UUID}/status`),
  rule("GET", `tickets/${UUID}/attachments/${UUID}/download`),
  rule("POST", "session/bootstrap/request", "none", "none"),
  rule("GET", "session/devices"),
  rule("DELETE", `session/devices/${UUID}`, "none", "none"),
];

export function publicRoutePolicy(method: string, segments: readonly string[]): PublicRoutePolicy | undefined {
  if (segments.length === 0 || segments.some((segment) => !SAFE_SEGMENT.test(segment))) return undefined;
  const path = segments.join("/");
  return RULES.find((entry) => entry.method === method && entry.pattern.test(path))?.policy;
}

function rule(
  method: string,
  path: string,
  body: BodyKind = "none",
  idempotency: PublicRoutePolicy["idempotency"] = "none",
) {
  return { method, pattern: new RegExp(`^${path}$`), policy: { body, idempotency } };
}
