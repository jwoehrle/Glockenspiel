import { describe, expect, it } from "vitest";
import { OnsetDetector } from "../../src/mic/onset";

/** Feed (time, rms) frames; return the times at which analysis fired. */
function run(d: OnsetDetector, frames: Array<[number, number]>, sens = 6): number[] {
  return frames.filter(([t, r]) => d.step(r, t, sens)).map(([t]) => t);
}
const frames = (from: number, to: number, rmsAt: (t: number) => number): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let t = from; t <= to; t += 16) out.push([t, rmsAt(t)]);
  return out;
};

describe("OnsetDetector", () => {
  it("fires once, ~55 ms after a strike", () => {
    const d = new OnsetDetector();
    const fired = run(
      d,
      frames(1000, 2000, (t) => (t < 1200 ? 0.001 : 0.2 * Math.exp(-(t - 1200) / 400))),
    );
    expect(fired).toHaveLength(1);
    const delay = (fired[0] ?? NaN) - 1200;
    expect(delay).toBeGreaterThan(OnsetDetector.DELAY_MS);
    expect(delay).toBeLessThan(OnsetDetector.DELAY_MS + 32);
  });

  it("detects a new strike while the previous bar still rings", () => {
    const d = new OnsetDetector();
    const ring = (t: number) =>
      t < 1200 ? 0.001 : t < 1600 ? 0.2 * Math.exp(-(t - 1200) / 600) : 0.3 * Math.exp(-(t - 1600) / 600);
    expect(run(d, frames(1000, 2200, ring))).toHaveLength(2);
  });

  it("ignores quiet sounds below the sensitivity threshold", () => {
    const d = new OnsetDetector();
    expect(
      run(
        d,
        frames(1000, 1500, (t) => (t < 1200 ? 0 : 0.01)),
        1,
      ),
    ).toEqual([]);
  });

  it("stays muted while blocked (the app's own tone)", () => {
    const d = new OnsetDetector();
    d.block(1000, 1500);
    expect(
      run(
        d,
        frames(1000, 2000, (t) => (t < 1200 ? 0.001 : 0.3)),
      ),
    ).toEqual([]);
  });
});
