import { COL, FREQ, ORDER, type NoteName } from "../notes";
import { cents, nearestMidi } from "./pitch";

export type Calibration = Record<NoteName, number>;

export type Verdict = { kind: "hit" } | { kind: "miss"; note: NoteName } | { kind: "none" };

/**
 * Judge a strike against the expected bar. Pitch AND octave must match, because the low and high bars
 * of the same color (C/c, D/d, E/e, F/f) are different notes.
 * - With a calibration: within ±50 cents of the calibrated frequency.
 * - Without: the nearest equal-tempered MIDI note (±40 cents) must equal the bar's MIDI number.
 * @param freqs spectral peaks, strongest first
 */
export function judge(freqs: number[], target: NoteName, cal: Calibration | null): Verdict {
  if (!freqs.length) return { kind: "none" };
  if (cal) {
    if (freqs.some((f) => Math.abs(cents(f, cal[target])) < 50)) return { kind: "hit" };
    for (const f of freqs) {
      const k = ORDER.find((k) => Math.abs(cents(f, cal[k])) < 50);
      if (k) return { kind: "miss", note: k };
    }
    return { kind: "none" };
  }
  const cands: number[] = [];
  for (const f of freqs) {
    const m = nearestMidi(f);
    if (m !== null) cands.push(m);
  }
  if (!cands.length) return { kind: "none" };
  if (cands.includes(COL[target].midi)) return { kind: "hit" };
  const k = ORDER.find((k) => COL[k].midi === cands[0]);
  return k ? { kind: "miss", note: k } : { kind: "none" };
}

/** During calibration: the strongest peak within ±120 cents of the bar's nominal frequency. */
export const calibrationPeak = (freqs: number[], n: NoteName): number | undefined =>
  freqs.find((f) => Math.abs(cents(f, FREQ[n])) < 120);

/**
 * Validate a stored calibration. Calibrations saved with only the first eight bars stay valid;
 * missing high bars fall back to their nominal frequency.
 */
export function normalizeCalibration(o: unknown): Calibration | null {
  if (!o || typeof o !== "object") return null;
  const rec = o as Record<string, unknown>;
  const ok = (v: unknown): v is number => typeof v === "number" && v > 400;
  if (!ORDER.slice(0, 8).every((n) => ok(rec[n]))) return null;
  return Object.fromEntries(ORDER.map((n) => [n, ok(rec[n]) ? rec[n] : FREQ[n]])) as Calibration;
}
