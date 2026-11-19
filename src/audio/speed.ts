/** Playback speed of "play the whole song" (▶), as a factor of the song's own tempo. */
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
export type Speed = (typeof SPEEDS)[number];
export const DEFAULT_SPEED: Speed = 1;

const LABELS: Readonly<Record<Speed, string>> = { 0.5: "½×", 0.75: "¾×", 1: "1×", 1.25: "1¼×", 1.5: "1½×" };

export const isSpeed = (x: unknown): x is Speed => (SPEEDS as readonly unknown[]).includes(x);

/** One step slower (🐌); stays at the slowest speed. */
export const slower = (s: Speed): Speed => SPEEDS[Math.max(0, SPEEDS.indexOf(s) - 1)] ?? s;

/** One step faster (🏎); stays at the fastest speed. */
export const faster = (s: Speed): Speed => SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(s) + 1)] ?? s;

export const isSlowest = (s: Speed): boolean => s === SPEEDS[0];
export const isFastest = (s: Speed): boolean => s === SPEEDS[SPEEDS.length - 1];

/** Short label for the "normal speed" button, e.g. "¾×". */
export const speedLabel = (s: Speed): string => LABELS[s];
