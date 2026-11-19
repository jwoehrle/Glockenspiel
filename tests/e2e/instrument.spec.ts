import { expect, test, type Page } from "@playwright/test";
import { SONGS } from "../../src/songs";
import { currentIndex, openSong } from "./helpers";

const TABLET_PORTRAIT = { width: 768, height: 1024 };
const TABLET_LANDSCAPE = { width: 1024, height: 768 };
const PHONE = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
// Browser content areas on common laptops (screen minus tabs and address bar).
const LAPTOP_SMALL = { width: 1280, height: 640 };
const LAPTOP = { width: 1440, height: 800 };

const instrument = (page: Page) => page.locator("#instrument");
const highlighted = (page: Page) => page.locator("#instrument .bar.on");

test.describe("tablet portrait", () => {
  test.use({ viewport: TABLET_PORTRAIT });

  test("shows the whole glockenspiel with the bar to strike popping out", async ({ page }) => {
    await page.goto("./");
    await expect(instrument(page)).toBeHidden(); // start screen
    await openSong(page, "Bruder Jakob");
    await expect(instrument(page)).toBeVisible();
    await expect(page.locator("#instrument .bar")).toHaveCount(11);
    await expect(highlighted(page)).toHaveCount(1);
    await expect(highlighted(page)).toHaveAttribute("data-note", "G");

    // Low and high bars of the same color are different bars in the picture.
    await page.locator("#track .dot").nth(10).click();
    await expect(highlighted(page)).toHaveAttribute("data-note", "d");
    await expect(highlighted(page)).toHaveText("D★");
    await page.locator("#track .dot").nth(27).click();
    await expect(highlighted(page)).toHaveAttribute("data-note", "D");
    await page.waitForTimeout(400); // let the pop transition finish
    await page.screenshot({ path: "test-results/instrument-tablet-portrait.png", fullPage: true });

    // Follows the song as it advances.
    await page.locator("#big").click();
    await expect(highlighted(page)).toHaveAttribute("data-note", SONGS.jakob.notes[28]?.n ?? "");
  });

  test("bar colors and order match the real instrument", async ({ page }) => {
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const bars = await page
      .locator("#instrument .bar")
      .evaluateAll((bs) =>
        bs.map((b) => [(b as HTMLElement).dataset.note, getComputedStyle(b).backgroundColor]),
      );
    expect(bars.map(([n]) => n).join("")).toBe("CDEFGAHcdef");
    // Same color left and right for C/c, D/d, E/e, F/f.
    for (const [lo, hi] of [
      [0, 7],
      [1, 8],
      [2, 9],
      [3, 10],
    ] as const) {
      expect(bars[lo]?.[1]).toBe(bars[hi]?.[1]);
    }
  });

  test("hidden on the finish screen", async ({ page }) => {
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    for (let i = 0; i < SONGS.jakob.notes.length; i++) await page.locator("#big").click({ force: true });
    await expect(page.locator("#done")).toBeVisible();
    await expect(instrument(page)).toBeHidden();
  });
});

test.describe("playing without a real glockenspiel (tablet portrait)", () => {
  test.use({ viewport: TABLET_PORTRAIT });

  // Count tones: every bell() call creates three oscillators (one per partial).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { tones: number };
      w.tones = 0;
      const orig = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function (this: AudioContext) {
        w.tones += 1 / 3;
        return orig.call(this);
      };
    });
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
  });
  const tones = (page: Page) =>
    page.evaluate(() => Math.round((window as unknown as { tones: number }).tones));
  const bar = (page: Page, colorName: string) =>
    page.locator("#instrument").getByRole("button", { name: colorName, exact: true });

  test("tapping the right bar plays it and advances", async ({ page }) => {
    // Bruder Jakob starts G A H G.
    await bar(page, "Grau").click();
    expect(await currentIndex(page)).toBe(1);
    await bar(page, "Blau").click();
    await bar(page, "Lila").click();
    expect(await currentIndex(page)).toBe(3);
    expect(await tones(page)).toBe(3);
  });

  test("tapping a wrong bar plays it but only wobbles", async ({ page }) => {
    await bar(page, "Rot").click();
    await expect(page.locator("#big")).toHaveClass(/miss/);
    expect(await currentIndex(page)).toBe(0);
    expect(await tones(page)).toBe(1);
  });

  test("low and high bars of the same color are different keys", async ({ page }) => {
    await page.locator("#track .dot").nth(10).click(); // high d
    await bar(page, "Braun").click(); // low D: wrong
    expect(await currentIndex(page)).toBe(10);
    await bar(page, "Braun rechts").click();
    expect(await currentIndex(page)).toBe(11);
  });

  test("tapping the big circle plays the note and advances", async ({ page }) => {
    await page.locator("#big").click();
    await page.locator("#big").click();
    expect(await currentIndex(page)).toBe(2);
    expect(await tones(page)).toBe(2);
  });

  test("a whole song can be played on the screen", async ({ page }) => {
    const names: Record<string, string> = Object.fromEntries(
      await page
        .locator("#instrument .bar")
        .evaluateAll((bs) => bs.map((b) => [(b as HTMLElement).dataset.note, b.getAttribute("aria-label")])),
    );
    for (const x of SONGS.jakob.notes) await bar(page, names[x.n] ?? "").click({ force: true });
    await expect(page.locator("#done")).toBeVisible();
  });
});

for (const [name, viewport] of [
  ["small laptop", LAPTOP_SMALL],
  ["laptop", LAPTOP],
  ["tablet landscape", TABLET_LANDSCAPE],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });
    test("glockenspiel beside the circle, everything fits without scrolling", async ({ page }) => {
      await page.goto("./");
      await openSong(page, "Bruder Jakob");
      await expect(instrument(page)).toBeVisible();
      const big = await page.locator("#big").boundingBox();
      const ins = await instrument(page).boundingBox();
      if (!big || !ins) throw new Error("not laid out");
      expect(ins.x).toBeGreaterThan(big.x + big.width); // right of the circle
      expect(ins.y).toBeLessThan(big.y + big.height); // side by side, not below
      for (const id of ["#track", ".controls"]) {
        const b = await page.locator(id).boundingBox();
        expect(b && b.y + b.height, `${id} visible without scrolling`).toBeLessThanOrEqual(viewport.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        viewport.height,
      );

      // Same behavior as on the tablet: highlight follows, bars are tappable.
      await expect(highlighted(page)).toHaveAttribute("data-note", "G");
      await page.locator("#instrument").getByRole("button", { name: "Grau", exact: true }).click();
      await expect(highlighted(page)).toHaveAttribute("data-note", "A");
      await page.waitForTimeout(400);
      await page.screenshot({ path: `test-results/instrument-${name.replace(" ", "-")}.png` });
    });

    test("finish screen spans the whole width", async ({ page }) => {
      await page.goto("./");
      await openSong(page, "Bruder Jakob");
      for (let i = 0; i < SONGS.jakob.notes.length; i++) await page.locator("#big").click({ force: true });
      await expect(page.locator("#done")).toBeVisible();
      await expect(instrument(page)).toBeHidden();
    });
  });
}

for (const [name, viewport] of [
  ["phone", PHONE],
  ["phone landscape", PHONE_LANDSCAPE],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });
    test("does not show the glockenspiel picture", async ({ page }) => {
      await page.goto("./");
      await openSong(page, "Bruder Jakob");
      await expect(page.locator("#big")).toBeVisible();
      await expect(instrument(page)).toBeHidden();
      await page.screenshot({
        path: `test-results/instrument-${name.replace(" ", "-")}.png`,
        fullPage: true,
      });
    });
  });
}
