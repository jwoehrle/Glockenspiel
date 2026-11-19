import { expect, test, type Page } from "@playwright/test";
import { wavPath } from "./fixtures";
import { currentIndex, openSong } from "./helpers";

/**
 * Run `fn` in a browser whose microphone plays the given recording (Chromium takes the fake capture file
 * as a launch argument, so each recording needs its own browser).
 */
async function withRecording(
  playwright: typeof import("playwright-core"),
  baseURL: string | undefined,
  name: string,
  fn: (page: Page) => Promise<void>,
): Promise<void> {
  const browser = await playwright.chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${wavPath(name)}`,
    ],
  });
  try {
    const page = await browser.newPage(baseURL ? { baseURL } : {});
    await page.goto("./");
    await fn(page);
  } finally {
    await browser.close();
  }
}

test("correct strikes advance the song (Bruder Jakob, first phrase)", async ({ playwright, baseURL }) => {
  await withRecording(playwright, baseURL, "jakob", async (page) => {
    await openSong(page, "Bruder Jakob");
    await expect.poll(() => currentIndex(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(8);
  });
});

test("octave-specific: the low D does not count for the high d", async ({ playwright, baseURL }) => {
  await withRecording(playwright, baseURL, "lowD", async (page) => {
    await openSong(page, "Bruder Jakob");
    await page.locator("#track .dot").nth(10).click(); // high d
    await expect(page.locator("#big")).toHaveClass(/miss/, { timeout: 10_000 });
    await page.waitForTimeout(4000);
    expect(await currentIndex(page)).toBe(10);
  });
});

test("octave-specific: the high d counts for the high d", async ({ playwright, baseURL }) => {
  await withRecording(playwright, baseURL, "highD", async (page) => {
    await openSong(page, "Bruder Jakob");
    await page.locator("#track .dot").nth(10).click();
    await expect.poll(() => currentIndex(page), { timeout: 10_000 }).toBe(11);
  });
});
