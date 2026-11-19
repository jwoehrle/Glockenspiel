import { resolve } from "node:path";
import { FREQ, type NoteName } from "../../src/notes";
import { strikes, writeWav } from "./wav";

export const FIXTURE_DIR = resolve(import.meta.dirname, ".fixtures");
export const wavPath = (name: string): string => resolve(FIXTURE_DIR, `${name}.wav`);

/** Fake microphone recordings used by the e2e tests. */
export const RECORDINGS: Record<string, NoteName[]> = {
  // Default for UI tests: a quiet room (Chromium's built-in fake device would beep).
  silence: [],
  // First phrase of Bruder Jakob, played correctly.
  jakob: ["G", "A", "H", "G", "G", "A", "H", "G"],
  // Low D struck repeatedly (wrong octave when the song expects the high d).
  lowD: ["D", "D", "D", "D", "D", "D"],
  // High d struck repeatedly.
  highD: ["d", "d", "d", "d", "d", "d"],
};

export default function globalSetup(): void {
  for (const [name, notes] of Object.entries(RECORDINGS))
    writeWav(wavPath(name), strikes(notes.map((n) => FREQ[n])));
}
