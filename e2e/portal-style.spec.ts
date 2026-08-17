import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const CATEGORY_ID = "0190f2a8-7d32-7000-8000-000000000010";

test("l'accueil porte la marque KAMGOKO ITSM, sans mention Keycloak et accessible", async ({ page }) => {
  await page.route("**/api/config**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { frameAllowed: true } }),
  }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByAltText("Logo KAMGOKO ITSM")).toBeVisible();
  await expect(page.getByText("KAMGOKO ITSM", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Assistance Télécom", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Keycloak/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: "e2e/screenshots/portal-accueil.png", fullPage: true });
});

test("l'espace demandeur affiche la marque et un état vide sobre", async ({ page }) => {
  await mockEmptyTickets(page);
  await page.goto("/demandes", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mes demandes" })).toBeVisible();
  await expect(page.getByAltText("Logo KAMGOKO ITSM")).toBeVisible();
  await expect(page.getByText("KAMGOKO ITSM", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Aucune demande pour le moment")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Keycloak/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: "e2e/screenshots/portal-demandes.png", fullPage: true });
});

test("la nouvelle demande reste sobre, accessible et sans mention Keycloak", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/nouvelle-demande", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Créer une demande" })).toBeVisible();
  await expect(page.getByLabel("Catégorie")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Keycloak/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: "e2e/screenshots/portal-nouvelle-demande.png", fullPage: true });
});

async function mockEmptyTickets(page: Page): Promise<void> {
  await page.route("**/api/public/tickets**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
  }));
}

async function mockCatalog(page: Page): Promise<void> {
  await page.route("**/api/public/catalog**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      success: true,
      data: { categories: [{ id: CATEGORY_ID, name: "Internet", description: null }], services: [] },
    }),
  }));
}
