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
  // Relative to the page's (fake) time, so it also works for a second playback in the same test.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 2000);
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

// ---------- speed: 🐌 slower, 1× normal, 🏎 faster ----------
const slowerBtn = (page: Page) => page.getByRole("button", { name: "Langsamer" });
const fasterBtn = (page: Page) => page.getByRole("button", { name: "Schneller" });
const normalBtn = (page: Page) => page.getByRole("button", { name: "Normales Tempo" });

/** Run the fake clock to just before and just after each onset and check the current note. */
async function expectOnsets(
  page: Page,
  onsets: readonly number[],
  first: number,
  start: number,
): Promise<number> {
  let now = start;
  for (let k = 0; k < onsets.length; k++) {
    const t = onsets[k] ?? 0;
    if (t - 20 > now) {
      await page.clock.runFor(t - 20 - now);
      now = t - 20;
      expect(await currentIndex(page), `before note ${first + k}`).toBe(first + k - 1);
    }
    await page.clock.runFor(t + 10 - now);
    now = t + 10;
    expect(await currentIndex(page), `note ${first + k}`).toBe(first + k);
  }
  return now;
}

test("🐌 plays slower, 🏎 faster, 1× goes back to the song's tempo; the choice is saved", async ({ page }) => {
  await page.goto("./");
  await openSong(page, "Freude, schöner Götterfunken");
  const notes = SONGS.freude.notes;
  const bpm = SONGS.freude.bpm;
  await expect(normalBtn(page)).toHaveText("1×");
  await expect(normalBtn(page)).not.toHaveClass(/changed/);

  await slowerBtn(page).click();
  await expect(normalBtn(page)).toHaveText("¾×");
  await expect(normalBtn(page)).toHaveClass(/changed/);
  await startPlayback(page);
  await expectOnsets(page, schedule(notes, bpm * 0.75).onsets.slice(0, 6), 0, 0);
  await playButton(page).click(); // stop

  await fasterBtn(page).click();
  await fasterBtn(page).click();
  await expect(normalBtn(page)).toHaveText("1¼×");
  await startPlayback(page);
  await expectOnsets(page, schedule(notes, bpm * 1.25).onsets.slice(0, 6), 0, 0);
  await playButton(page).click();

  await page.reload();
  await openSong(page, "Freude, schöner Götterfunken");
  await expect(normalBtn(page)).toHaveText("1¼×"); // saved

  // Limits: the buttons switch off at ½× and 1½×.
  await fasterBtn(page).click();
  await expect(normalBtn(page)).toHaveText("1½×");
  await expect(fasterBtn(page)).toBeDisabled();
  for (let i = 0; i < 4; i++) await slowerBtn(page).click();
  await expect(normalBtn(page)).toHaveText("½×");
  await expect(slowerBtn(page)).toBeDisabled();
  await expect(fasterBtn(page)).toBeEnabled();

  await normalBtn(page).click();
  await expect(normalBtn(page)).toHaveText("1×");
  await expect(normalBtn(page)).not.toHaveClass(/changed/);
  await startPlayback(page);
  await expectOnsets(page, schedule(notes, bpm).onsets.slice(0, 6), 0, 0);
});

test("changing the speed during playback goes on at the new tempo instead of stopping", async ({ page }) => {
  await page.goto("./");
  await openSong(page, "Freude, schöner Götterfunken");
  const notes = SONGS.freude.notes;
  const bpm = SONGS.freude.bpm;
  await startPlayback(page);
  const normal = schedule(notes, bpm).onsets;
  await expectOnsets(page, normal.slice(0, 3), 0, 0); // up to note 2
  const played = await tones(page);

  await slowerBtn(page).click();
  await expect(playButton(page)).toHaveText("⏹"); // still playing
  expect(await currentIndex(page)).toBe(2);
  // From now on: ¾ speed. Note 3 comes after note 2's full length at the new tempo.
  const slow = schedule(notes, bpm * 0.75).onsets;
  const t2 = slow[2] ?? 0;
  const rest = slow.slice(3, 7).map((t) => t - t2);
  await expectOnsets(page, rest, 3, 0);
  expect(await tones(page)).toBe(played + 4);

  // 1× while playing: back to the normal tempo.
  await normalBtn(page).click();
  const n0 = normal[6] ?? 0;
  await expectOnsets(
    page,
    normal.slice(7, 10).map((t) => t - n0),
    7,
    0,
  );
  await expect(playButton(page)).toHaveText("⏹");
});

for (const [name, viewport] of [
  ["tablet portrait", { width: 768, height: 1024 }],
  ["small laptop", { width: 1280, height: 640 }],
] as const) {
  test(`${name}: 🐌 1× 🏎 fit into the one row of controls`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const centers = await page.locator(".controls button").evaluateAll((bs: HTMLElement[]) =>
      bs
        .filter((b) => b.offsetParent)
        .map((b) => b.getBoundingClientRect())
        .map((r) => r.top + r.height / 2),
    );
    expect(centers.length).toBeGreaterThanOrEqual(7);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(4);
  });
}
