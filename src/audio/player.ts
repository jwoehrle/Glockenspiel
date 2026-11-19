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

  play(notes: readonly Timed[], bpm: number, cb: PlayCallbacks): void {
    this.stop();
    const { onsets, total } = schedule(notes, bpm);
    onsets.forEach((t, i) => this.timers.push(window.setTimeout(() => cb.onNote(i), t)));
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
