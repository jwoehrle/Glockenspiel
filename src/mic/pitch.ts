/** Distance in cents between two frequencies. */
export const cents = (f: number, ref: number): number => 1200 * Math.log2(f / ref);

/** Fractional MIDI note number of a frequency. */
export const freqToMidi = (f: number): number => 69 + 12 * Math.log2(f / 440);

/**
 * Nearest MIDI note, or null if the frequency is more than `tol` semitones away from equal temperament
 * (default 0.4 = ±40 cents).
 */
export function nearestMidi(f: number, tol = 0.4): number | null {
  const midi = freqToMidi(f);
  const r = Math.round(midi);
  return Math.abs(midi - r) < tol ? r : null;
}

/** Root mean square of the last `window` samples. */
export function rms(buf: Float32Array, window = buf.length): number {
  const n = buf.length;
  let s = 0;
  for (let i = n - window; i < n; i++) {
    const v = buf[i] ?? 0;
    s += v * v;
  }
  return Math.sqrt(s / window);
}

/**
 * Up to four strongest spectral peaks between loHz and hiHz (strongest first), with parabolic
 * interpolation. Peaks more than 12 dB below the strongest are dropped.
 * @param sp magnitude spectrum in dB (AnalyserNode.getFloatFrequencyData)
 * @param binHz width of one FFT bin in Hz
 */
export function peakFreqs(sp: Float32Array, binHz: number, loHz = 450, hiHz = 5000): number[] {
  const at = (i: number): number => sp[i] ?? -Infinity;
  const lo = Math.floor(loHz / binHz);
  const hi = Math.min(Math.ceil(hiHz / binHz), sp.length - 1);
  const peaks: number[] = [];
  for (let i = lo + 1; i < hi; i++) {
    if (at(i) > at(i - 1) && at(i) >= at(i + 1)) peaks.push(i);
  }
  peaks.sort((x, y) => at(y) - at(x));
  const first = peaks[0];
  if (first === undefined) return [];
  const top = at(first);
  const out: number[] = [];
  for (const i of peaks.slice(0, 4)) {
    if (at(i) < top - 12) break;
    const p = (0.5 * (at(i - 1) - at(i + 1))) / (at(i - 1) - 2 * at(i) + at(i + 1) || 1);
    out.push((i + p) * binHz);
  }
  return out;
}
