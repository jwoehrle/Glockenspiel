// Sonor children's glockenspiel: 11 bars, c3–f4 (C major). Lowercase = high bars on the right (same color as the low twin).

/** The eleven bars, low to high. */
export const ORDER = ["C", "D", "E", "F", "G", "A", "H", "c", "d", "e", "f"] as const;
export type NoteName = (typeof ORDER)[number];

export type ColorKey = "green" | "brown" | "red" | "yellow" | "grey" | "blue" | "lilac";

export interface Bar {
  /** Bar color as CSS hex. */
  hex: string;
  /** Color key; the name in the UI language comes from i18n (`color.<key>`). */
  color: ColorKey;
  /** MIDI note number of the bar (C = c3 = 1046.5 Hz = MIDI 84). Detection checks pitch AND octave. */
  midi: number;
}

export const COL: Readonly<Record<NoteName, Bar>> = {
  C: { hex: "#3F6B47", color: "green", midi: 84 },
  D: { hex: "#5B4239", color: "brown", midi: 86 },
  E: { hex: "#B4504B", color: "red", midi: 88 },
  F: { hex: "#F2B63C", color: "yellow", midi: 89 },
  G: { hex: "#9AA6B2", color: "grey", midi: 91 },
  A: { hex: "#2B9BD9", color: "blue", midi: 93 },
  H: { hex: "#8E5E9E", color: "lilac", midi: 95 },
  c: { hex: "#3F6B47", color: "green", midi: 96 },
  d: { hex: "#5B4239", color: "brown", midi: 98 },
  e: { hex: "#B4504B", color: "red", midi: 100 },
  f: { hex: "#F2B63C", color: "yellow", midi: 101 },
};

export const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Nominal (equal-tempered) frequency of each bar in Hz. */
export const FREQ = Object.fromEntries(ORDER.map((n) => [n, midiToFreq(COL[n].midi)])) as Readonly<
  Record<NoteName, number>
>;

export const isNoteName = (s: string): s is NoteName => (ORDER as readonly string[]).includes(s);

/** High bars (right side) are written in lowercase. */
export const isHigh = (n: NoteName): boolean => n !== n.toUpperCase();

/** Display label: always an uppercase letter; high bars additionally get a star in the UI. */
export const label = (n: NoteName): string => n.toUpperCase();

/** The high twin of a low bar with the same color (C→c, D→d, …), if the instrument has one. */
export const highTwin = (n: NoteName): NoteName | null => {
  if (isHigh(n)) return null;
  const lo = n.toLowerCase();
  return isNoteName(lo) && lo !== n ? lo : null;
};
