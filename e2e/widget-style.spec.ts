import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const INTEGRATION_KEY = "integration-public-001";

test("le widget affiche la marque KAMGOKO ITSM, sans mention Keycloak et accessible", async ({ page }) => {
  await mockWidgetApi(page);
  await page.goto(`/widget?integrationKey=${INTEGRATION_KEY}&parentOrigin=http%3A%2F%2Flocalhost%3A3200`, { waitUntil: "networkidle" });
  await expect(page.getByAltText("Logo KAMGOKO ITSM")).toBeVisible();
  await expect(page.getByText("KAMGOKO ITSM", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Assistance Télécom", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Keycloak/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: "e2e/screenshots/widget-accueil.png", fullPage: true });
});

test("le widget reste contenu dans un viewport mobile étroit", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await mockWidgetApi(page);
  await page.goto(`/widget?integrationKey=${INTEGRATION_KEY}&parentOrigin=http%3A%2F%2Flocalhost%3A3200`, { waitUntil: "networkidle" });
  await expect(page.getByAltText("Logo KAMGOKO ITSM")).toBeVisible();
  const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, height: document.documentElement.scrollHeight }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.height).toBeGreaterThan(0);
});

async function mockWidgetApi(page: Page): Promise<void> {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/config") return json(route, { frameAllowed: true });
    if (path === "/api/auth/csrf") return json(route, { csrfToken: "csrf-token-at-least-twenty-characters" });
    if (path === "/api/public/tickets") return json(route, [], { page: 1, limit: 10, total: 0, totalPages: 0 });
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ success: false }) });
  });
}

function json(route: Route, data: unknown, meta?: object) {
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }) });
}
