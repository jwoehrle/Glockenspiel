import { describe, expect, it } from "vitest";
import { schedule } from "../../src/audio/player";
import { SONGS } from "../../src/songs";

describe("schedule()", () => {
  it("places notes by their lengths and rests at the given tempo", () => {
    const notes = [
      { beats: 1, rest: 0 },
      { beats: 0.5, rest: 0 },
      { beats: 0.5, rest: 1 },
      { beats: 2, rest: 1 },
    ];
    // 120 bpm: one beat = 500 ms
    expect(schedule(notes, 120)).toEqual({ onsets: [0, 500, 750, 1500], total: 2500 });
  });

  it("handles an empty song", () => {
    expect(schedule([], 100)).toEqual({ onsets: [], total: 0 });
  });

  it("Bruder Jakob at 120 bpm lasts 16 s", () => {
    const { onsets, total } = schedule(SONGS.jakob.notes, SONGS.jakob.bpm);
    expect(total).toBe(16000);
    // "schläfst du noch?" = quarter, quarter, half
    expect(onsets.slice(8, 12)).toEqual([4000, 4500, 5000, 6000]);
  });
});
