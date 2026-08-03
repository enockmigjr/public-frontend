/** @jest-environment node */

jest.mock("server-only", () => ({}));

import { NextResponse } from "next/server";
import {
  clearSessionCookies,
  cookieNameFor,
  cookieOptionsFor,
  setCsrfSeed,
  setIntegrationCookie,
  setSessionCookies,
} from "./cookies";

const TOKENS = {
  accessToken: "access-token",
  expiresIn: 900,
  trustedDeviceToken: "device-token",
  trustedDeviceExpiresAt: "2026-09-01T12:00:00.000Z",
} as const;

describe("cookies publics", () => {
  it("isole les cookies portail en développement avec SameSite=Lax", () => {
    const response = NextResponse.json({ success: true });

    setSessionCookies(response, "portal", TOKENS);
    setCsrfSeed(response, "portal", "csrf-seed");
    setIntegrationCookie(response, "portal", "integration-key");

    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain("support_session=access-token");
    expect(header).toContain("support_device=device-token");
    expect(header).toContain("support_csrf=csrf-seed");
    expect(header).toContain("support_integration=integration-key");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=lax");
    expect(header).not.toContain("Secure");
    expect(header).not.toContain("Partitioned");
  });

  it("isole les cookies widget en développement avec SameSite=None", () => {
    const response = NextResponse.json({ success: true });

    setSessionCookies(response, "widget", TOKENS);
    setCsrfSeed(response, "widget", "csrf-seed");

    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain("support_iframe_session=access-token");
    expect(header).toContain("support_iframe_device=device-token");
    expect(header).toContain("support_iframe_csrf=csrf-seed");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=none");
    expect(header).not.toContain("Secure");
    expect(header).not.toContain("Partitioned");
  });

  it("expire uniquement la session et l'appareil du contexte demandé", () => {
    const response = NextResponse.json({ success: true });
    clearSessionCookies(response, "widget");

    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain("support_iframe_session=");
    expect(header).toContain("support_iframe_device=");
    expect(header).toContain("Max-Age=0");
    expect(header).not.toContain("support_session=");
  });

  it("applique le préfixe Secure et Partitioned en production", () => {
    expect(cookieNameFor("portal", "session", true)).toBe("__Host-support_session");
    expect(cookieNameFor("widget", "session", true)).toBe("__Host-support_iframe_session");
    expect(cookieOptionsFor("portal", true)).toMatchObject({ secure: true, sameSite: "lax", partitioned: false });
    expect(cookieOptionsFor("widget", true)).toMatchObject({ secure: true, sameSite: "none", partitioned: true });
  });
});
