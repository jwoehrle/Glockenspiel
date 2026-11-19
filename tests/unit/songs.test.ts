import { describe, expect, it } from "vitest";
import { ORDER } from "../../src/notes";
import { SONGS, SONG_KEYS, build, parseLength } from "../../src/songs";

// Icons used elsewhere in the UI; song tiles must not reuse them.
const RESERVED_ICONS = ["🔊", "🎤", "🏠", "🔁", "⚙", "⭐", "✨", "🌟", "🎵", "▶", "⏹", "🐌", "🏎", "🏎️"];

describe("song data", () => {
  it.each(SONG_KEYS)("%s only uses the eleven bars", (k) => {
    const notes = SONGS[k].notes;
    expect(notes.length).toBeGreaterThan(10);
    for (const x of notes) expect(ORDER).toContain(x.n);
  });

  it("every song has a unique icon that is not used elsewhere in the UI", () => {
    const icons = SONG_KEYS.map((k) => SONGS[k].icon);
    expect(new Set(icons).size).toBe(icons.length);
    for (const i of icons) expect(RESERVED_ICONS).not.toContain(i);
  });

  it("every song has a unique title", () => {
    const titles = SONG_KEYS.map((k) => SONGS[k].title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  // Exact note sequences, verified against LilyPond sources (Wikibooks Liederbuch / German Wikipedia).
  it.each([
    ["jakob", "G A H G G A H G H c d H c d d e d c H G d e d c H G G D G G D G"],
    // lieder-archiv.de MIDI 200066
    ["kinderlein", "G G E G G E G F D F E G G E G G E G F D F E E D D D F F F E E E A A G G G c G E G F D C"],
    // lieder-archiv.de MIDI 200076, F♯ played as F (accepted by the user)
    [
      "kling",
      "G E F G A G A G F D G E D D E C E D F F G D F E D D E F G D E A G F A G G E F G A G A G F D G E",
    ],
    [
      "freude",
      "H H c d d c H A G G A H H A A H H c d d c H A G G A H A G G A A H G A H c H G A H c H A G A D H H c d d c H A G G A H A G G",
    ],
  ] as const)("%s matches its source", (k, seq) => {
    expect(SONGS[k].notes.map((x) => x.n).join(" ")).toBe(seq);
  });
});

describe("build()", () => {
  it("splits syllables, multi-note syllables and lines, with lengths and rests", () => {
    expect(build(["Mar-|C tin|DE", "a_b|c"], ["4 8 8 r4", "2."])).toEqual([
      { s: "Mar-", n: "C", line: 0, beats: 1, rest: 0 },
      { s: "tin", n: "D", line: 0, beats: 0.5, rest: 0 },
      { s: "～", n: "E", line: 0, beats: 0.5, rest: 1 },
      { s: "a b", n: "c", line: 1, beats: 3, rest: 0 },
    ]);
  });

  it("rejects notes the glockenspiel does not have", () => {
    expect(() => build(["la|B"], ["4"])).toThrow(/Unknown note "B"/);
    expect(() => build(["la|g"], ["4"])).toThrow(/Unknown note "g"/);
  });

  it("rejects malformed tokens", () => {
    expect(() => build(["la"], ["4"])).toThrow(/Bad token/);
  });

  it("rejects rhythm lines that do not match the notes", () => {
    expect(() => build(["la|C le|D"], ["4"])).toThrow(/fewer lengths/);
    expect(() => build(["la|C"], ["4 4"])).toThrow(/more lengths/);
    expect(() => build(["la|C"], ["r4 4"])).toThrow(/Rest before/);
    expect(() => build(["la|C", "le|D"], ["4"])).toThrow(/rhythm lines/);
    expect(() => build(["la|C"], ["3"])).toThrow(/Bad note length/);
  });
});

describe("parseLength()", () => {
  it.each([
    ["1", 4],
    ["2.", 3],
    ["4", 1],
    ["4.", 1.5],
    ["8", 0.5],
    ["16", 0.25],
    ["4+16", 1.25],
  ] as const)("%s = %d beats", (tok, beats) => {
    expect(parseLength(tok)).toBe(beats);
  });
});

describe("rhythm data", () => {
  it.each(SONG_KEYS)("%s has a tempo and a length for every note", (k) => {
    const s = SONGS[k];
    expect(s.bpm).toBeGreaterThanOrEqual(60);
    expect(s.bpm).toBeLessThanOrEqual(160);
    for (const x of s.notes) expect(x.beats).toBeGreaterThan(0);
  });

  // Total length in beats, from the sources (pickups and final rests excluded).
  it.each([
    ["jakob", 32],
    ["freude", 64],
    ["jahre", 31], // 8 bars of 4/4, ends on a dotted half
    ["weihnachtsmann", 48],
  ] as const)("%s lasts %d beats", (k, total) => {
    expect(SONGS[k].notes.reduce((t, x) => t + x.beats + x.rest, 0)).toBe(total);
  });
});
