/** @jest-environment node */

jest.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { createCsrf, verifyCsrf } from "./csrf";

const SECRET = "csrf-secret-with-at-least-thirty-two-characters";

function request(cookie?: string, token?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (token) headers.set("x-csrf-token", token);
  return new NextRequest("https://support.example.test/api/auth/csrf", { headers });
}

describe("CSRF synchronizer", () => {
  beforeAll(() => {
    process.env.BACKEND_URL = "https://backend.example.test";
    process.env.PUBLIC_SUPPORT_INTEGRATION_KEY = "integration-key-long-enough";
    process.env.PUBLIC_BFF_CSRF_SECRET = SECRET;
  });

  it("crée un seed quand aucune session n'existe puis le lie au token", () => {
    const created = createCsrf(request(), "portal");

    expect(created.seed).toBeDefined();
    const bound = request(`support_csrf=${created.seed}`, created.token);
    expect(verifyCsrf(bound, "portal")).toBe(true);
  });

  it("lie prioritairement le token à la session", () => {
    const issued = createCsrf(request("support_session=session-a; support_csrf=old-seed"), "portal");

    expect(issued.seed).toBeUndefined();
    expect(verifyCsrf(request("support_session=session-a", issued.token), "portal")).toBe(true);
    expect(verifyCsrf(request("support_session=session-b", issued.token), "portal")).toBe(false);
  });

  it("sépare strictement les contextes portail et widget", () => {
    const issued = createCsrf(request("support_session=session-a"), "portal");

    expect(verifyCsrf(request("support_iframe_session=session-a", issued.token), "widget")).toBe(false);
  });

  it.each([
    [undefined, "support_session=session-a"],
    ["invalid-token", "support_session=session-a"],
    ["invalid-token", undefined],
  ] as const)("rejette un token absent, altéré ou non lié", (token, cookie) => {
    expect(verifyCsrf(request(cookie, token), "portal")).toBe(false);
  });
});
