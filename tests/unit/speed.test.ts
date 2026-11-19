import { describe, expect, it } from "vitest";
import { scheduleFrom, schedule } from "../../src/audio/player";
import { DEFAULT_SPEED, SPEEDS, faster, isFastest, isSlowest, isSpeed, slower } from "../../src/audio/speed";
import { SONGS } from "../../src/songs";

describe("playback speed", () => {
  it("steps through ½× ¾× 1× 1¼× 1½× and stops at both ends", () => {
    expect(SPEEDS).toEqual([0.5, 0.75, 1, 1.25, 1.5]);
    expect(DEFAULT_SPEED).toBe(1);
    expect(slower(1)).toBe(0.75);
    expect(slower(0.75)).toBe(0.5);
    expect(slower(0.5)).toBe(0.5);
    expect(faster(1)).toBe(1.25);
    expect(faster(1.25)).toBe(1.5);
    expect(faster(1.5)).toBe(1.5);
    expect(isSlowest(0.5) && isFastest(1.5)).toBe(true);
    expect(isSlowest(1) || isFastest(1)).toBe(false);
  });

  it("only accepts the known speeds (for loading saved options)", () => {
    expect(isSpeed(0.75)).toBe(true);
    for (const x of [0, 2, "1", null, undefined, 0.8]) expect(isSpeed(x)).toBe(false);
  });

  it("half speed doubles every onset", () => {
    const n = SONGS.jakob.notes;
    const normal = schedule(n, SONGS.jakob.bpm);
    const slow = schedule(n, SONGS.jakob.bpm * 0.5);
    expect(slow.total).toBe(normal.total * 2);
    expect(slow.onsets).toEqual(normal.onsets.map((t) => t * 2));
  });
});

describe("scheduleFrom()", () => {
  const notes = [
    { beats: 1, rest: 0 },
    { beats: 0.5, rest: 0 },
    { beats: 0.5, rest: 1 },
    { beats: 2, rest: 1 },
  ];

  it("from the start equals schedule()", () => {
    expect(scheduleFrom(notes, 120, 0)).toEqual(schedule(notes, 120));
  });

  it("starts at note `from` after `lead` ms", () => {
    // 120 bpm: onsets 0, 500, 750, 1500; total 2500
    expect(scheduleFrom(notes, 120, 2, 300)).toEqual({ onsets: [300, 1050], total: 2050 });
  });

  it("past the end plays nothing", () => {
    expect(scheduleFrom(notes, 120, 4)).toEqual({ onsets: [], total: 0 });
  });
});
