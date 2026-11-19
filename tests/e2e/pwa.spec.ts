import { expect, test } from "@playwright/test";
import { openSong } from "./helpers";

test("manifest is linked and valid", async ({ page, request }) => {
  await page.goto("./");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/Glockenspiel/manifest.webmanifest");
  const m = await (await request.get(href ?? "")).json();
  expect(m.name).toBe("Mein Glockenspiel");
  expect(m.lang).toBe("de");
  for (const icon of m.icons) expect((await request.get(`/Glockenspiel/${icon.src}`)).ok()).toBe(true);
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("./");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/Glockenspiel\/$/);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#songs button")).toHaveCount(8);
  await openSong(page, "Bruder Jakob");
  await expect(page.locator("#big")).toHaveText("G");
});
