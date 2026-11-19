export interface Timed {
  /** Length in beats (quarter note = 1). */
  beats: number;
  /** Rest after the note, in beats. */
  rest: number;
}

/** Onset of every note in ms from the start, plus the total length (end of the last note). */
export function schedule(notes: readonly Timed[], bpm: number): { onsets: number[]; total: number } {
  const beatMs = 60000 / bpm;
  const onsets: number[] = [];
  let t = 0;
  for (const x of notes) {
    onsets.push(t);
    t += (x.beats + x.rest) * beatMs;
  }
  const last = notes[notes.length - 1];
  return { onsets, total: last ? t - last.rest * beatMs : 0 };
}

/**
 * Like schedule(), but starting at note `from`, which plays `lead` ms from now (used when the speed changes
 * during playback: the song goes on at the new tempo instead of starting over). Onsets are for notes from…end.
 */
export function scheduleFrom(
  notes: readonly Timed[],
  bpm: number,
  from: number,
  lead = 0,
): { onsets: number[]; total: number } {
  const { onsets, total } = schedule(notes, bpm);
  const t0 = onsets[from];
  if (t0 === undefined) return { onsets: [], total: 0 };
  return { onsets: onsets.slice(from).map((t) => t - t0 + lead), total: total - t0 + lead };
}

export interface PlayCallbacks {
  /** Note i starts now. */
  onNote(i: number): void;
  /** The song played to the end (not called after stop()). */
  onEnd(): void;
}

/** Plays a song note by note. Timers are scheduled from one start time, so they do not drift. */
export class SongPlayer {
  private timers: number[] = [];

  get playing(): boolean {
    return this.timers.length > 0;
  }

  /** Play from note `from` (default: the start); note `from` starts after `lead` ms. */
  play(notes: readonly Timed[], bpm: number, cb: PlayCallbacks, from = 0, lead = 0): void {
    this.stop();
    const { onsets, total } = scheduleFrom(notes, bpm, from, lead);
    onsets.forEach((t, i) => this.timers.push(window.setTimeout(() => cb.onNote(from + i), t)));
    this.timers.push(
      window.setTimeout(() => {
        this.timers = [];
        cb.onEnd();
      }, total),
    );
  }

  stop(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }
}
