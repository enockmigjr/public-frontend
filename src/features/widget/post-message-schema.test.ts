import { hostMessageSchema, widgetMessageSchema } from "./post-message-schema";

const ASSERTION = "a".repeat(80);

describe("schémas postMessage", () => {
  it("accepte uniquement l'assertion d'identité bornée attendue", () => {
    expect(hostMessageSchema.safeParse({ type: "IDENTITY_ASSERTION", assertion: ASSERTION }).success).toBe(true);
    expect(hostMessageSchema.safeParse({ type: "IDENTITY_ASSERTION", assertion: "short" }).success).toBe(false);
    expect(hostMessageSchema.safeParse({ type: "IDENTITY_ASSERTION", assertion: "a".repeat(8193) }).success).toBe(false);
  });

  it.each([
    null,
    "IDENTITY_ASSERTION",
    { type: "READY", assertion: ASSERTION },
    { type: "IDENTITY_ASSERTION" },
    { type: "IDENTITY_ASSERTION", assertion: 42 },
    { type: "__proto__", assertion: ASSERTION },
  ])("rejette le message hôte hostile %p", (payload) => {
    expect(hostMessageSchema.safeParse(payload).success).toBe(false);
  });

  it.each([
    { type: "READY" },
    { type: "RESIZE", height: 320 },
    { type: "RESIZE", height: 760 },
    { type: "OPEN_PORTAL" },
    { type: "IDENTITY_ACCEPTED" },
  ])("accepte le message widget %p", (payload) => {
    expect(widgetMessageSchema.safeParse(payload).success).toBe(true);
  });

  it.each([
    { type: "RESIZE", height: 319 },
    { type: "RESIZE", height: 761 },
    { type: "RESIZE", height: 400.5 },
    { type: "NAVIGATE", url: "https://evil.example" },
  ])("rejette le message widget hostile %p", (payload) => {
    expect(widgetMessageSchema.safeParse(payload).success).toBe(false);
  });
});
