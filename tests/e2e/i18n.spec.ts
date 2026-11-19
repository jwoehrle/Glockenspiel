import { expect, test } from "@playwright/test";
import { SONGS } from "../../src/songs";
import { openSong } from "./helpers";

test.describe("browser in English", () => {
  test.use({ locale: "en-GB" });

  test("starts in English with flags in the switcher", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#title")).toHaveText("🎵 My Glockenspiel");
    await expect(page).toHaveTitle("My Glockenspiel");
    await expect(page.locator("#lang")).toHaveValue("en");
    await expect(page.locator("#lang option")).toHaveText(["🇬🇧", "🇩🇪"]);
    await expect(page.locator("#settingsBtn")).toHaveAttribute("aria-label", "Parent area");
  });

  test("switching the language changes the UI but not the songs", async ({ page }) => {
    await page.goto("./");
    await page.locator("#lang").selectOption("de");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
    await expect(page.locator("#home")).toHaveAttribute("aria-label", "Lieder");
    // Song titles are not translated.
    for (const s of Object.values(SONGS)) await expect(page.locator("#songs")).toContainText(s.title);
    await page.locator("#lang").selectOption("en");
    await expect(page.locator("#title")).toHaveText("🎵 My Glockenspiel");
    for (const s of Object.values(SONGS)) await expect(page.locator("#songs")).toContainText(s.title);
  });

  test("the language of an open song changes at once and the syllables stay", async ({ page }) => {
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    await expect(page.locator("#colname")).toHaveText("Grey");
    await expect(page.locator("#next span").first()).toHaveText("next");
    await page.locator("#lang").selectOption("de");
    await expect(page.locator("#colname")).toHaveText("Grau");
    await expect(page.locator("#next span").first()).toHaveText("danach");
    await expect(page.locator("#syl")).toHaveText("Bru-");
    await expect(page.locator("#title")).toHaveText("😴 Bruder Jakob");
    await expect(page.locator("#instrument .bar").first()).toHaveAttribute("aria-label", "Grün");
  });

  test("high and low bars of the same color are told apart in English", async ({ page }) => {
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    await page.locator("#track .dot").nth(10).click();
    await expect(page.locator("#colname")).toHaveText("Brown right");
    await page.locator("#track .dot").nth(27).click();
    await expect(page.locator("#colname")).toHaveText("Brown left");
  });

  test("the choice is remembered after a reload", async ({ page }) => {
    await page.goto("./");
    await page.locator("#lang").selectOption("de");
    await page.reload();
    await expect(page.locator("#lang")).toHaveValue("de");
    await expect(page.locator("#title")).toHaveText("🎵 Mein Glockenspiel");
  });

  test("the parent area is translated", async ({ page }) => {
    await page.goto("./");
    await page.locator("#settingsBtn").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "🧹 Delete all saved data" })).toBeVisible();
    await expect(page.locator("#calState")).toHaveText("No calibration saved.");
    await page.locator("#lang").selectOption("de", { force: true });
    await expect(page.locator("#calState")).toHaveText("Keine Kalibrierung gespeichert.");
    await expect(page.getByRole("button", { name: "Schließen" })).toBeVisible();
  });
});

test.describe("browser in German", () => {
  test.use({ locale: "de-DE" });

  test("starts in German", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("#lang")).toHaveValue("de");
  });
});

test.describe("unsupported browser language", () => {
  test.use({ locale: "fr-FR" });

  test("falls back to English", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("#title")).toHaveText("🎵 My Glockenspiel");
  });
});
