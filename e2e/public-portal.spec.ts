import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("la page de vérification reste accessible au clavier", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Signalez un incident/i })).toBeVisible();
  await page.getByLabel("Adresse email").focus();
  await expect(page.getByLabel("Adresse email")).toBeFocused();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("une session révoquée renvoie vers la vérification avec son motif", async ({ page }) => {
  await page.route("**/api/public/tickets**", (route) => route.fulfill({
    status: 401,
    contentType: "application/json",
    body: JSON.stringify({ success: false, error: { code: "PUBLIC_SESSION_REQUIRED", message: "Session expirée" } }),
  }));
  await page.goto("/demandes");
  await expect(page).toHaveURL(/\/?session=expired$/);
  await expect(page.getByRole("heading", { name: /Signalez un incident/i })).toBeVisible();
});
