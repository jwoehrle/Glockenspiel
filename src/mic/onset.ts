/**
 * Onset detection on a short window (last 512 samples ≈ 10 ms), triggered by a RISE versus the previous
 * frame. Ringing bars only get quieter; a new strike is always a jump upwards. Do not replace this with a
 * long window or a slow average: new strikes become undetectable while the previous bar still rings.
 */
export class OnsetDetector {
  /** Time of the last analysed strike; may lie in the future to mute detection (see block()). */
  private lastHit = 0;
  /** Time a rise was seen; analysis happens DELAY_MS later, when the FFT window holds the new tone. */
  private pending = 0;
  private prevRms = 0;

  static readonly WINDOW = 512;
  static readonly DELAY_MS = 55;
  static readonly REFRACTORY_MS = 150;

  /** Minimum RMS for an onset, from the sensitivity slider (1–10). */
  static minRms(sens: number): number {
    return 0.004 + (10 - sens) * 0.006;
  }

  /** Mute detection for `ms`, so the app does not "hear" its own tone or speech. */
  block(now: number, ms: number): void {
    this.lastHit = now + ms;
    this.pending = 0;
  }

  /** Feed one animation frame. Returns true when the spectrum should be analysed now. */
  step(rms: number, now: number, sens: number): boolean {
    if (
      !this.pending &&
      now - this.lastHit > OnsetDetector.REFRACTORY_MS &&
      rms > OnsetDetector.minRms(sens) &&
      rms > this.prevRms * 1.5
    ) {
      this.pending = now;
    }
    this.prevRms = rms;
    if (this.pending && now - this.pending > OnsetDetector.DELAY_MS) {
      this.pending = 0;
      this.lastHit = now;
      return true;
    }
    return false;
  }
}
