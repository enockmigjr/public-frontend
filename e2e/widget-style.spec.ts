import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const INTEGRATION_KEY = "integration-public-001";

test("le widget affiche la marque KAMGOKO ITSM, sans mention Keycloak et accessible", async ({ page }) => {
  await mockWidgetApi(page);
  await page.goto(`/widget?integrationKey=${INTEGRATION_KEY}&parentOrigin=http%3A%2F%2Flocalhost%3A3200`, { waitUntil: "domcontentloaded" });
  await expect(page.getByAltText("Logo KAMGOKO ITSM")).toBeVisible();
  await expect(page.getByText("KAMGOKO ITSM", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Assistance Télécom", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Keycloak/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: "e2e/screenshots/widget-accueil.png", fullPage: true });
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
