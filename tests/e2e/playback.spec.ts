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

const box = async (page: Page, sel: string) => {
  const b = await page.locator(sel).boundingBox();
  if (!b) throw new Error(`${sel} not laid out`);
  return { ...b, bottom: b.y + b.height, right: b.x + b.width, cy: b.y + b.height / 2 };
};

for (const [name, viewport, beside] of [
  ["phone", { width: 390, height: 844 }, false],
  ["tablet portrait", { width: 768, height: 1024 }, false],
  ["tablet portrait (iPad 10th gen)", { width: 820, height: 1180 }, false],
  ["small laptop", { width: 1280, height: 640 }, true],
  ["tablet landscape", { width: 1024, height: 768 }, true],
] as const) {
  test(`${name}: ▶ in its own row below the track, 🐌 1× 🏎 in the row below`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await openSong(page, "Bruder Jakob");
    const track = await box(page, "#track");
    const play = await box(page, "#playsong");
    const slow = await box(page, "#slower");
    const norm = await box(page, "#speed");
    const fast = await box(page, "#faster");
    const controls = await box(page, ".controls");

    // ▶ directly below the track, alone in its row (nothing else at its height in the playback block)
    expect(play.y).toBeGreaterThanOrEqual(track.bottom);
    expect(play.y - track.bottom).toBeLessThan(40);
    await expect(page.locator(".playrow button")).toHaveCount(1);
    // 🐌 1× 🏎: one row, in this order, below ▶ and centered under it
    expect(slow.y).toBeGreaterThanOrEqual(play.bottom);
    for (const b of [norm, fast]) expect(Math.abs(b.cy - slow.cy)).toBeLessThan(2);
    expect(slow.right).toBeLessThanOrEqual(norm.x);
    expect(norm.right).toBeLessThanOrEqual(fast.x);
    expect(Math.abs((slow.x + fast.right) / 2 - (play.x + play.width / 2))).toBeLessThan(2);

    if (beside) {
      // landscape: the other controls to the right of the playback rows
      expect(controls.x).toBeGreaterThanOrEqual(fast.right);
      expect(controls.y).toBeGreaterThanOrEqual(track.bottom);
      expect(controls.bottom).toBeLessThanOrEqual(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        viewport.height,
      );
    } else {
      // portrait: the other controls below them
      expect(controls.y).toBeGreaterThanOrEqual(Math.max(slow.bottom, norm.bottom, fast.bottom));
      if (name.startsWith("tablet")) {
        // tablets: still everything on one screen
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
          viewport.height,
        );
      }
    }
    await page.screenshot({ path: `test-results/playback-rows-${name.replace(" ", "-")}.png` });
  });
}
