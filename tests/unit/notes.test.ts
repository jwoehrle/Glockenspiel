import { describe, expect, it } from "vitest";
import { COL, FREQ, ORDER, highTwin, isHigh, label } from "../../src/notes";

describe("bars", () => {
  it("are the Sonor c3–f4 C-major bars", () => {
    expect(ORDER.map((n) => COL[n].midi)).toEqual([84, 86, 88, 89, 91, 93, 95, 96, 98, 100, 101]);
    expect(FREQ.C).toBeCloseTo(1046.5, 1);
    expect(FREQ.c).toBeCloseTo(2093.0, 1);
    expect(FREQ.f).toBeCloseTo(2793.8, 1);
  });

  it("high bars share the color of their low twin", () => {
    for (const n of ["C", "D", "E", "F"] as const) {
      const hi = highTwin(n);
      expect(hi).not.toBeNull();
      if (hi) expect(COL[hi].hex).toBe(COL[n].hex);
    }
    expect(highTwin("G")).toBeNull();
    expect(highTwin("c")).toBeNull();
  });

  it("labels high bars with an uppercase letter", () => {
    expect(isHigh("d")).toBe(true);
    expect(isHigh("D")).toBe(false);
    expect(label("e")).toBe("E");
  });
});
