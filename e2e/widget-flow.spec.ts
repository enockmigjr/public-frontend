import { expect, test, type Page, type Route } from "@playwright/test";

const INTEGRATION_KEY = "integration-public-001";
const CATEGORY_ID = "0190f2a8-7d32-7000-8000-000000000010";
const CONVERSATION_ID = "0190f2a8-7d32-7000-8000-000000000020";
const TICKET_ID = "0190f2a8-7d32-7000-8000-000000000030";

test("le widget vérifie le contact puis crée et suit une demande", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto(`/widget?integrationKey=${INTEGRATION_KEY}&parentOrigin=http%3A%2F%2Flocalhost%3A3200`);
  await page.getByLabel("Adresse email").fill("client@example.com");
  await page.getByRole("button", { name: /Recevoir un code/i }).click();
  await page.getByLabel("Code à 6 chiffres").fill("123456");
  await page.getByRole("button", { name: /Continuer/i }).click();
  await expect(page.getByRole("button", { name: /Nouvelle demande/i })).toBeVisible();

  await page.getByRole("button", { name: /Nouvelle demande/i }).click();
  await page.getByLabel("Catégorie").selectOption(CATEGORY_ID);
  await page.getByLabel("Objet").fill("Connexion fibre instable");
  await page.getByLabel("Description").fill("La connexion se coupe plusieurs fois depuis ce matin.");
  await page.getByText("Je confirme l’envoi").click();
  await page.getByRole("button", { name: "Envoyer" }).click();

  await expect(page.getByText("Connexion fibre instable")).toBeVisible();
  await expect(page.getByText("INC-2026-0001")).toBeVisible();
});

async function mockPublicApi(page: Page): Promise<void> {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (path === "/api/config") return json(route, { frameAllowed: true });
    if (path === "/api/auth/csrf") return json(route, { csrfToken: "csrf-token-at-least-twenty-characters" });
    if (path === "/api/auth/email/request") return json(route, { challengeId: CONVERSATION_ID });
    if (path === "/api/auth/email/consume") return json(route, { verified: true });
    if (path === "/api/public/tickets" && method === "GET") return json(route, [], { page: 1, limit: 10, total: 0, totalPages: 0 });
    if (path === "/api/public/catalog") return json(route, { categories: [{ id: CATEGORY_ID, name: "Internet", description: null }], services: [] });
    if (path === "/api/public/conversations" && method === "POST") return json(route, { id: CONVERSATION_ID, state: "QUALIFY" });
    if (path === `/api/public/conversations/${CONVERSATION_ID}/draft`) return json(route, { id: CONVERSATION_ID, state: "DRAFT", draft: { categoryId: CATEGORY_ID, title: "Connexion fibre instable", description: "La connexion se coupe plusieurs fois depuis ce matin.", impact: "MEDIUM", urgency: "MEDIUM" } });
    if (path === `/api/public/conversations/${CONVERSATION_ID}/confirm`) return json(route, { conversationId: CONVERSATION_ID, ticketId: TICKET_ID, ticketNumber: "INC-2026-0001" });
    if (path === `/api/public/tickets/${TICKET_ID}`) return json(route, { id: TICKET_ID, ticketNumber: "INC-2026-0001", title: "Connexion fibre instable", description: "La connexion se coupe plusieurs fois depuis ce matin.", status: "RECEIVED", createdAt: "2026-08-03T12:00:00.000Z", updatedAt: "2026-08-03T12:00:00.000Z", firstResponseDueAt: null, resolutionDueAt: null, resolvedAt: null, closedAt: null });
    if (path === `/api/public/tickets/${TICKET_ID}/timeline`) return json(route, []);
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ success: false }) });
  });
}

function json(route: Route, data: unknown, meta?: object) {
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }) });
}
