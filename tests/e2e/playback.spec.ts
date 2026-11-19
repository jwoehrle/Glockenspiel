import { expect, test, type Page } from "@playwright/test";
import { schedule } from "../../src/audio/player";
import { SONGS } from "../../src/songs";
import { currentIndex, openSong } from "./helpers";

// Fake timers: a 16 s song runs in milliseconds. Every bell() creates three oscillators.
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const w = window as unknown as { tones: number };
    w.tones = 0;
    const orig = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.tones += 1 / 3;
      return orig.call(this);
    };
  });
});
const tones = (page: Page) => page.evaluate(() => Math.round((window as unknown as { tones: number }).tones));
const playButton = (page: Page) => page.locator("#playsong");
/** Freeze the fake clock (it runs in real time after install), then press play. */
async function startPlayback(page: Page): Promise<void> {
  await page.clock.pauseAt(Date.now() + 2000);
  await playButton(page).click();
}

test.describe("tablet portrait", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("plays the whole song in rhythm; circle, track and glockenspiel follow every note", async ({
    page,
  }) => {
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const notes = SONGS.jakob.notes;
    const { onsets, total } = schedule(notes, SONGS.jakob.bpm);

    await startPlayback(page);
    await expect(playButton(page)).toHaveText("⏹");
    let now = 0;
    for (let i = 0; i < notes.length; i++) {
      const t = onsets[i] ?? 0;
      await page.clock.runFor(t + 10 - now); // just after the note starts
      now = t + 10;
      const n = notes[i]?.n ?? "C";
      expect(await currentIndex(page), `note ${i}`).toBe(i);
      await expect(page.locator("#big")).toHaveAttribute("data-note", n);
      await expect(page.locator("#instrument .bar.on")).toHaveAttribute("data-note", n);
      // ...and not yet the next one, shortly before it starts
      const next = onsets[i + 1];
      if (next !== undefined && next - t > 100) {
        await page.clock.runFor(next - 20 - now);
        now = next - 20;
        expect(await currentIndex(page), `still note ${i}`).toBe(i);
      }
    }
    expect(await tones(page)).toBe(notes.length);

    await page.clock.runFor(total - now + 10);
    await expect(playButton(page)).toHaveText("▶");
    expect(await currentIndex(page)).toBe(0); // back to the start, ready to play along
  });
});

test("stop ends the playback and goes back to the start", async ({ page }) => {
  await page.goto("./");
  await openSong(page, "Freude, schöner Götterfunken");
  await startPlayback(page);
  await page.clock.runFor(1210); // 120 bpm: third note
  expect(await currentIndex(page)).toBe(2);
  await playButton(page).click();
  await expect(playButton(page)).toHaveText("▶");
  expect(await currentIndex(page)).toBe(0);
  const played = await tones(page);
  await page.clock.runFor(5000);
  expect(await tones(page)).toBe(played);
  expect(await currentIndex(page)).toBe(0);
});

test("tapping the circle during playback stops it", async ({ page }) => {
  await page.goto("./");
  await openSong(page, "Jingle Bells");
  await startPlayback(page);
  await page.clock.runFor(700);
  await page.locator("#big").click();
  await expect(playButton(page)).toHaveText("▶");
  expect(await currentIndex(page)).toBe(0);
});

test("going home stops the playback", async ({ page }) => {
  await page.goto("./");
  await openSong(page, "Alle Jahre wieder");
  await startPlayback(page);
  await page.clock.runFor(700);
  await page.getByRole("button", { name: "Lieder" }).click();
  const played = await tones(page);
  await page.clock.runFor(5000);
  expect(await tones(page)).toBe(played);
});
