let ctx: AudioContext | null = null;

/** Shared AudioContext (created lazily on the first user gesture, resumed if suspended). */
export function audio(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Bell-like partials: [frequency ratio, gain, decay seconds]. */
const PARTIALS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0.5, 1.6],
  [2.76, 0.12, 0.5],
  [5.4, 0.05, 0.25],
];

/** Play a synthesized bell tone. Played one octave below the bar (sounds softer through phone speakers). */
export function bell(barFreq: number): void {
  const a = audio();
  const t = a.currentTime;
  const f = barFreq / 2;
  for (const [m, g, d] of PARTIALS) {
    const o = a.createOscillator();
    const v = a.createGain();
    o.type = "sine";
    o.frequency.value = f * m;
    v.gain.setValueAtTime(0, t);
    v.gain.linearRampToValueAtTime(g, t + 0.005);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  }
}
