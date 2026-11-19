import { describe, expect, it } from "vitest";
import { cents, freqToMidi, nearestMidi, peakFreqs, rms } from "../../src/mic/pitch";

describe("pitch helpers", () => {
  it("converts frequencies to MIDI", () => {
    expect(freqToMidi(440)).toBe(69);
    expect(freqToMidi(1046.5)).toBeCloseTo(84, 2);
  });

  it("measures cents", () => {
    expect(cents(880, 440)).toBeCloseTo(1200);
    expect(cents(440 * Math.pow(2, 30 / 1200), 440)).toBeCloseTo(30);
  });

  it("accepts ±40 cents, rejects more", () => {
    const at = (c: number) => 1046.5 * Math.pow(2, c / 1200);
    expect(nearestMidi(at(35))).toBe(84);
    expect(nearestMidi(at(-35))).toBe(84);
    expect(nearestMidi(at(45))).toBeNull();
  });

  it("computes RMS over the last window", () => {
    const buf = new Float32Array([0, 0, 0, 0, 1, -1, 1, -1]);
    expect(rms(buf, 4)).toBe(1);
    expect(rms(buf)).toBeCloseTo(Math.SQRT1_2);
  });
});

describe("peakFreqs()", () => {
  const binHz = 48000 / 4096;
  // Synthetic dB spectrum with Gaussian peaks.
  const spectrum = (peaks: Array<[hz: number, db: number]>) => {
    const sp = new Float32Array(2048).fill(-120);
    sp.forEach((_, i) => {
      let v = -120;
      for (const [hz, db] of peaks) v = Math.max(v, db - 3 * ((i * binHz - hz) / binHz) ** 2);
      sp[i] = v;
    });
    return sp;
  };

  it("finds the strongest peak first, interpolated to well under a bin", () => {
    const fs = peakFreqs(
      spectrum([
        [1318.5, -20],
        [3639, -28],
      ]),
      binHz,
    );
    expect(fs[0]).toBeCloseTo(1318.5, 0);
    expect(fs[1]).toBeCloseTo(3639, 0);
  });

  it("drops peaks more than 12 dB below the strongest and outside 450–5000 Hz", () => {
    const fs = peakFreqs(
      spectrum([
        [1568, -20],
        [2000, -40],
        [300, -10],
      ]),
      binHz,
    );
    expect(fs).toHaveLength(1);
    expect(fs[0]).toBeCloseTo(1568, 0);
  });

  it("returns nothing for a flat spectrum", () => {
    expect(peakFreqs(new Float32Array(2048).fill(-100), binHz)).toEqual([]);
  });
});
