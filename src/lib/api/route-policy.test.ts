import { publicRoutePolicy } from "./route-policy";

const ID = "01986f85-4e8d-7b03-9f1f-fd87494c6971";

describe("publicRoutePolicy", () => {
  it.each([
    ["GET", ["catalog"], "none", "none"],
    ["PATCH", ["preferences"], "json", "required"],
    ["POST", ["conversations"], "json", "required"],
    ["PATCH", ["conversations", ID, "draft"], "json", "optional"],
    ["POST", ["conversations", ID, "attachments"], "multipart", "required"],
    ["POST", ["tickets", ID, "comments"], "json", "required"],
    ["DELETE", ["session", "devices", ID], "none", "none"],
  ] as const)("autorise seulement %s /%s", (method, segments, body, idempotency) => {
    expect(publicRoutePolicy(method, segments)).toEqual({ body, idempotency });
  });

  it.each([
    ["POST", ["catalog"]],
    ["get", ["tickets"]],
    ["GET", ["admin", "users"]],
    ["GET", ["tickets", ID, "internal-notes"]],
    ["GET", ["tickets", "..", "catalog"]],
    ["GET", ["tickets", `${ID}/timeline`]],
    ["GET", ["tickets", `${ID}%2Ftimeline`]],
    ["GET", ["tickets", ID, "timeline", "extra"]],
  ] as const)("refuse la route hors allowlist %s /%s", (method, segments) => {
    expect(publicRoutePolicy(method, segments)).toBeUndefined();
  });

  it("refuse un identifiant composé uniquement de séparateurs", () => {
    expect(publicRoutePolicy("GET", ["tickets", "------------------------------------"])).toBeUndefined();
  });
});
