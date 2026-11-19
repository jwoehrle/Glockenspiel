import { expect, test, type Page } from "@playwright/test";

const LIVE = "/Glockenspiel/";
const PREVIEW = "/Glockenspiel/pr-preview/pr-1/";

const swScope = (page: Page) => page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
async function openSettings(page: Page): Promise<void> {
  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
}

test("live site has no preview label", async ({ page }) => {
  await page.goto(LIVE);
  await expect(page.locator("#songs button").first()).toBeVisible();
  await expect(page.locator("#preview")).toBeHidden();
  await expect(page).toHaveTitle("Mein Glockenspiel");
});

test("a preview opens as the preview, even after the live site's worker is installed", async ({ page }) => {
  await page.goto(LIVE);
  expect(await swScope(page)).toMatch(/\/Glockenspiel\/$/);
  // The live worker's scope covers the preview path; it must not answer with the live app.
  await page.goto(PREVIEW);
  await expect(page.locator("#preview")).toHaveText("Vorschau PR 1");
  await expect(page).toHaveTitle("Mein Glockenspiel (PR 1)");
  expect(await swScope(page)).toMatch(/\/Glockenspiel\/pr-preview\/pr-1\/$/);
  // And back: the live site still shows the live app.
  await page.goto(LIVE);
  await expect(page.locator("#preview")).toBeHidden();
});

test("the preview works offline under its own path", async ({ page, context }) => {
  await page.goto(PREVIEW);
  await swScope(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#preview")).toHaveText("Vorschau PR 1");
  await expect(page.locator("#songs button")).toHaveCount(8);
});

test("the preview manifest has its own name", async ({ page, request }) => {
  await page.goto(PREVIEW);
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe(`${PREVIEW}manifest.webmanifest`);
  const m = await (await request.get(href ?? "")).json();
  expect(m.name).toBe("Mein Glockenspiel (PR 1)");
});

test("preview and live site keep separate settings", async ({ page }) => {
  await page.goto(LIVE);
  await openSettings(page);
  await page.locator("#optAuto").check();

  await page.goto(PREVIEW);
  await openSettings(page);
  await expect(page.locator("#optAuto")).not.toBeChecked();
  await page.locator("#optSpeak").check();
  // "Clear all data" in the preview must not touch the live site's data.
  await page.getByRole("button", { name: "🧹 Alle gespeicherten Daten löschen" }).click();

  await page.goto(LIVE);
  await openSettings(page);
  await expect(page.locator("#optAuto")).toBeChecked();
  await expect(page.locator("#optSpeak")).not.toBeChecked();
});
