import { describe, expect, it } from "vitest";
import { calibrationPeak, judge, normalizeCalibration, type Calibration } from "../../src/mic/detect";
import { FREQ, ORDER } from "../../src/notes";

const detune = (f: number, c: number) => f * Math.pow(2, c / 1200);

describe("judge() without calibration", () => {
  it("hits the right bar within ±40 cents", () => {
    expect(judge([detune(FREQ.E, 30)], "E", null)).toEqual({ kind: "hit" });
  });

  it("is octave-specific: low D does not count for high d and vice versa", () => {
    expect(judge([FREQ.D], "d", null)).toEqual({ kind: "miss", note: "D" });
    expect(judge([FREQ.d], "D", null)).toEqual({ kind: "miss", note: "d" });
    expect(judge([FREQ.C], "c", null)).toEqual({ kind: "miss", note: "C" });
  });

  it("accepts the target among several peaks", () => {
    expect(judge([FREQ.G, FREQ.c], "c", null)).toEqual({ kind: "hit" });
  });

  it("reports the strongest recognised bar as the miss", () => {
    expect(judge([FREQ.A, FREQ.F], "C", null)).toEqual({ kind: "miss", note: "A" });
  });

  it("ignores sounds that are not on any bar or off-pitch", () => {
    expect(judge([], "C", null)).toEqual({ kind: "none" });
    expect(judge([detune(FREQ.C, 50)], "C", null)).toEqual({ kind: "none" });
    expect(judge([FREQ.C * Math.pow(2, 1 / 12)], "C", null)).toEqual({ kind: "none" }); // C♯
  });
});

describe("judge() with calibration", () => {
  // An instrument tuned 30 cents flat everywhere.
  const cal = Object.fromEntries(ORDER.map((n) => [n, detune(FREQ[n], -30)])) as Calibration;

  it("matches within ±50 cents of the calibrated bar", () => {
    expect(judge([detune(FREQ.H, -30 + 45)], "H", cal)).toEqual({ kind: "hit" });
    // 55 cents above the calibrated H is only 45 cents below the calibrated c: a miss on c, not a hit.
    expect(judge([detune(FREQ.H, -30 + 55)], "H", cal)).toEqual({ kind: "miss", note: "c" });
    expect(judge([detune(FREQ.G, -30 + 60)], "G", cal)).toEqual({ kind: "none" });
  });

  it("is octave-specific", () => {
    expect(judge([cal.e], "E", cal)).toEqual({ kind: "miss", note: "e" });
  });
});

describe("calibration", () => {
  it("picks the strongest peak near the bar's nominal frequency", () => {
    expect(calibrationPeak([FREQ.G, detune(FREQ.A, 100)], "A")).toBeCloseTo(detune(FREQ.A, 100));
    expect(calibrationPeak([FREQ.G], "A")).toBeUndefined();
  });

  it("loads old eight-bar calibrations and fills the high bars with nominal values", () => {
    const old = Object.fromEntries(ORDER.slice(0, 8).map((n) => [n, FREQ[n] + 1]));
    const c = normalizeCalibration(old);
    expect(c?.C).toBe(FREQ.C + 1);
    expect(c?.d).toBe(FREQ.d);
    expect(c?.f).toBe(FREQ.f);
  });

  it("rejects incomplete or invalid calibrations", () => {
    expect(normalizeCalibration(null)).toBeNull();
    expect(normalizeCalibration({ C: 1046 })).toBeNull();
    expect(normalizeCalibration({ ...FREQ, D: "x" })).toBeNull();
  });
});
