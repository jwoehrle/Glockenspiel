import { expect, type Page } from "@playwright/test";

/** Index of the current note in the track (-1 if none is current, e.g. on the finish screen). */
export const currentIndex = (page: Page): Promise<number> =>
  page.locator("#track .dot").evaluateAll((ds) => ds.findIndex((d) => d.classList.contains("cur")));

export async function openSong(page: Page, title: string): Promise<void> {
  await page.locator("#songs button", { hasText: title }).click();
  await expect(page.locator("body")).toHaveClass(/^play\b/);
}
