import { expect, test } from "@playwright/test";
import { SONGS } from "../../src/songs";
import { openSong } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("starts in German with flags in the switcher", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
  await expect(page).toHaveTitle("Mein Glockenspiel");
  await expect(page.locator("#lang")).toHaveValue("de");
  await expect(page.locator("#lang option")).toHaveText(["🇬🇧", "🇩🇪"]);
  await expect(page.locator("#settingsBtn")).toHaveAttribute("aria-label", "Eltern-Bereich");
});

test.describe("browser in English", () => {
  test.use({ locale: "en-GB" });

  test("German is still the default", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
  });
});

test("switching the language changes the UI but not the songs", async ({ page }) => {
  await page.locator("#lang").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#title")).toHaveText("🎵 My Glockenspiel");
  await expect(page).toHaveTitle("My Glockenspiel");
  await expect(page.locator("#home")).toHaveAttribute("aria-label", "Songs");
  // Song titles are not translated.
  for (const s of Object.values(SONGS)) await expect(page.locator("#songs")).toContainText(s.title);
  await page.locator("#lang").selectOption("de");
  await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
  for (const s of Object.values(SONGS)) await expect(page.locator("#songs")).toContainText(s.title);
});

test("an open song changes language at once and the syllables stay", async ({ page }) => {
  await openSong(page, "Bruder Jakob");
  await expect(page.locator("#colname")).toHaveText("Grau");
  await expect(page.locator("#next span").first()).toHaveText("danach");
  await page.locator("#lang").selectOption("en");
  await expect(page.locator("#colname")).toHaveText("Grey");
  await expect(page.locator("#next span").first()).toHaveText("next");
  await expect(page.locator("#syl")).toHaveText("Bru-");
  await expect(page.locator("#title")).toHaveText("😴 Bruder Jakob");
  await expect(page.locator("#instrument .bar").first()).toHaveAttribute("aria-label", "Green");
});

test("high and low bars of the same color are told apart in English", async ({ page }) => {
  await page.locator("#lang").selectOption("en");
  await openSong(page, "Bruder Jakob");
  await page.locator("#track .dot").nth(10).click();
  await expect(page.locator("#colname")).toHaveText("Brown right");
  await page.locator("#track .dot").nth(27).click();
  await expect(page.locator("#colname")).toHaveText("Brown left");
});

test("the choice is remembered after a reload", async ({ page }) => {
  await page.locator("#lang").selectOption("en");
  await page.reload();
  await expect(page.locator("#lang")).toHaveValue("en");
  await expect(page.locator("#title")).toHaveText("🎵 My Glockenspiel");
});

test("the parent area is translated", async ({ page }) => {
  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#calState")).toHaveText("Keine Kalibrierung gespeichert.");
  await page.locator("#lang").selectOption("en", { force: true });
  await expect(page.getByRole("button", { name: "🧹 Delete all saved data" })).toBeVisible();
  await expect(page.locator("#calState")).toHaveText("No calibration saved.");
});
