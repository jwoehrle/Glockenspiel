import { expect, test, type Page } from "@playwright/test";
import { SONGS } from "../../src/songs";
import { openSong } from "./helpers";

const TABLET_PORTRAIT = { width: 768, height: 1024 };
const TABLET_LANDSCAPE = { width: 1024, height: 768 };
const PHONE = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const LAPTOP_SMALL = { width: 1280, height: 640 };
const LAPTOP = { width: 1440, height: 800 };

const staff = (page: Page) => page.locator("#staff");
const cur = (page: Page) => page.locator("#staff .cur-note");
const nextNote = (page: Page) => page.locator("#staff .next-note");

/** Written staff step of a bar (C5 = 7, consecutive for the eleven bars); see src/ui/staff.ts. */
const STEP = { C: 7, D: 8, E: 9, F: 10, G: 11, A: 12, H: 13, c: 14, d: 15, e: 16, f: 17 } as const;

async function staffOn(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem("glock-opts", JSON.stringify({ staff: true })));
}

test("staff notation is off by default and can be turned on in the parent area", async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.goto("./");
  await openSong(page, "Bruder Jakob");
  await expect(staff(page)).toBeHidden();

  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#optStaff")).not.toBeChecked();
  await page.locator("#optStaff").check();
  await page.keyboard.press("Escape");
  await expect(staff(page)).toBeVisible();

  await page.reload(); // persists
  await openSong(page, "Bruder Jakob");
  await expect(staff(page)).toBeVisible();
});

for (const [name, viewport] of [
  ["small laptop", LAPTOP_SMALL],
  ["laptop", LAPTOP],
  ["tablet landscape", TABLET_LANDSCAPE],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });

    test("staff left of the circle, glockenspiel right, no scrolling", async ({ page }) => {
      await staffOn(page);
      await page.goto("./");
      await openSong(page, "Bruder Jakob");
      await expect(staff(page)).toBeVisible();
      const s = await staff(page).boundingBox();
      const big = await page.locator("#big").boundingBox();
      const ins = await page.locator("#instrument").boundingBox();
      if (!s || !big || !ins) throw new Error("not laid out");
      expect(s.x + s.width).toBeLessThanOrEqual(big.x); // left of the circle
      expect(ins.x).toBeGreaterThanOrEqual(big.x + big.width); // glockenspiel stays on the right
      for (const id of ["#track", ".playback", ".controls"]) {
        const b = await page.locator(id).boundingBox();
        expect(b && b.y + b.height, `${id} visible without scrolling`).toBeLessThanOrEqual(viewport.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        viewport.height,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      await page.screenshot({ path: `test-results/notation-${name.replace(" ", "-")}.png` });
    });
  });
}

test.describe("tablet portrait", () => {
  test.use({ viewport: TABLET_PORTRAIT });

  test("staff in the free space left of the circle", async ({ page }) => {
    await staffOn(page);
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const s = await staff(page).boundingBox();
    const big = await page.locator("#big").boundingBox();
    if (!s || !big) throw new Error("not laid out");
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.width).toBeGreaterThanOrEqual(180); // big enough to read
    expect(s.x + s.width).toBeLessThanOrEqual(big.x);
    expect(s.y).toBeLessThan(big.y + big.height);
    expect(s.y + s.height).toBeGreaterThan(big.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    await page.screenshot({ path: "test-results/notation-tablet-portrait.png", fullPage: true });
  });
});

for (const [name, viewport] of [
  ["phone", PHONE],
  ["phone landscape", PHONE_LANDSCAPE],
] as const) {
  test(`hidden on a ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await staffOn(page);
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    await expect(staff(page)).toBeHidden();
  });
}

test.describe("what the staff shows", () => {
  test.use({ viewport: LAPTOP });

  test("current and next note follow the song; octaves differ; hidden on the finish screen", async ({
    page,
  }) => {
    await staffOn(page);
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const notes = SONGS.jakob.notes;
    for (const i of [0, 1, 2, 3]) {
      const n = notes[i]?.n;
      const nx = notes[i + 1]?.n;
      if (!n || !nx) throw new Error("song too short");
      await expect(cur(page)).toHaveAttribute("data-note", n);
      await expect(cur(page)).toHaveAttribute("data-step", String(STEP[n]));
      await expect(nextNote(page)).toHaveAttribute("data-note", nx);
      await page.locator("#big").click({ force: true });
    }
    // Low D and high d: same color, an octave apart on the staff.
    await page.locator("#track .dot").nth(10).click();
    await expect(cur(page)).toHaveAttribute("data-note", "d");
    await expect(cur(page)).toHaveAttribute("data-step", "15");
    await expect(cur(page).locator(".ledger")).toHaveCount(2);
    await page.locator("#track .dot").nth(27).click();
    await expect(cur(page)).toHaveAttribute("data-note", "D");
    await expect(cur(page)).toHaveAttribute("data-step", "8");
    await expect(cur(page).locator(".ledger")).toHaveCount(0);

    await page
      .locator("#track .dot")
      .nth(notes.length - 1)
      .click();
    await page.locator("#big").click({ force: true });
    await expect(page.locator("#done")).toBeVisible();
    await expect(staff(page)).toBeHidden();
  });
});
