import { expect, test } from "@playwright/test";
import { FREQ } from "../../src/notes";
import { SONGS } from "../../src/songs";
import { currentIndex, openSong } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("start screen shows only the song tiles", async ({ page }) => {
  await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
  const tiles = page.locator("#songs button");
  await expect(tiles).toHaveCount(Object.keys(SONGS).length);
  for (const s of Object.values(SONGS)) await expect(page.locator("#songs")).toContainText(s.title);
  await expect(page.locator("#big")).toBeHidden();
  await expect(page.locator(".controls")).toBeHidden();
});

test("tapping a tile starts the song with the first note", async ({ page }) => {
  await openSong(page, "Bruder Jakob");
  await expect(page.locator("#title")).toHaveText("😴 Bruder Jakob");
  await expect(page.locator("#big")).toHaveText("G");
  await expect(page.locator("#colname")).toHaveText("Grau");
  await expect(page.locator("#syl")).toHaveText("Bru-");
  await expect(page.locator("#next .nd")).toHaveText("A");
  await expect(page.locator("#track .dot")).toHaveCount(SONGS.jakob.notes.length);
  // Tapping the tile also turns the microphone on (fake device in tests).
  await expect(page.locator("#mic")).toHaveClass("listening");
  expect(await currentIndex(page)).toBe(0);
});

test("high and low bars of the same color are told apart", async ({ page }) => {
  await openSong(page, "Bruder Jakob");
  // Note 10 is the high d ("noch?"), note 27 the low D ("dang").
  await page.locator("#track .dot").nth(10).click();
  await expect(page.locator("#big")).toHaveText("D★");
  await expect(page.locator("#colname")).toHaveText("Braun rechts");
  await expect(page.locator("#track .dot").nth(10).locator(".c")).toHaveText("D*");
  await page.locator("#track .dot").nth(27).click();
  await expect(page.locator("#big")).toHaveText("D");
  await expect(page.locator("#colname")).toHaveText("Braun links");
});

test("tapping the circle walks through the song to the finish screen and back", async ({ page }) => {
  await openSong(page, "Freude, schöner Götterfunken");
  const n = SONGS.freude.notes.length;
  // force: skip waiting for the pop animation to settle between taps.
  for (let i = 0; i < n; i++) await page.locator("#big").click({ force: true });
  await expect(page.locator("#done")).toBeVisible();
  await expect(page.locator("#done")).toContainText("Super gemacht!");
  await expect(page.locator("#big")).toBeHidden();
  await page.getByRole("button", { name: "🔁 Nochmal!" }).click();
  expect(await currentIndex(page)).toBe(0);
  await page.locator("#big").click();
  await page.locator("#big").click();
  expect(await currentIndex(page)).toBe(2);
  await page.getByRole("button", { name: "🔁 Von vorn" }).click();
  expect(await currentIndex(page)).toBe(0);
  await page.getByRole("button", { name: "Lieder" }).click();
  await expect(page.locator("body")).toHaveClass("home");
  await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
});

test("parent area opens only on press-and-hold or keyboard", async ({ page }) => {
  const gear = page.locator("#settingsBtn");
  const dialog = page.locator("#settings");
  const hint = page.locator("#gearhint");
  await gear.click();
  await expect(dialog).not.toBeVisible();
  // A short tap explains how to open it (instead of doing nothing), then the hint goes away again.
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("gedrückt halten");
  await expect(hint).toBeHidden({ timeout: 6000 });

  const box = await gear.boundingBox();
  if (!box) throw new Error("gear not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect(hint).toBeHidden(); // a successful hold must not leave the hint behind
  await page.getByRole("button", { name: "Schließen" }).click();
  await expect(dialog).not.toBeVisible();

  await gear.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
});

test("options are off by default and persist", async ({ page }) => {
  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#optAuto")).not.toBeChecked();
  await expect(page.locator("#optSpeak")).not.toBeChecked();
  await page.locator("#optAuto").check();
  await page.reload();
  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#optAuto")).toBeChecked();
  await page.getByRole("button", { name: "🧹 Alle gespeicherten Daten löschen" }).click();
  await expect(page.locator("#optAuto")).not.toBeChecked();
  await expect(page.locator("#setMsg")).toHaveText("Alle gespeicherten Daten gelöscht.");
});

test("a calibration saved before the high bars existed still loads", async ({ page }) => {
  const old = Object.fromEntries(["C", "D", "E", "F", "G", "A", "H", "c"].map((n) => [n, FREQ[n as "C"]]));
  await page.evaluate((c) => localStorage.setItem("glock-cal", JSON.stringify(c)), old);
  await page.reload();
  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#calState")).toHaveText("Kalibrierung gespeichert.");
  await expect(page.locator("#cal")).toHaveText("🎯 Neu kalibrieren");
  await page.getByRole("button", { name: "🗑 Kalibrierung löschen" }).click();
  await expect(page.locator("#calState")).toHaveText("Keine Kalibrierung gespeichert.");
});
