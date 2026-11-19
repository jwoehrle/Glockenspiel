import type { NoteName } from "./notes";
import { isNoteName } from "./notes";

export interface SongNote {
  /** Syllable shown under the circle ("～" for the 2nd+ note on one syllable). */
  s: string;
  n: NoteName;
  /** Line index within the song (used for spacing in the track). */
  line: number;
  /** Length in beats (quarter note = 1). */
  beats: number;
  /** Rest after the note, in beats. */
  rest: number;
}

export interface Song {
  icon: string;
  title: string;
  /** Tempo for playback, in quarter notes per minute. */
  bpm: number;
  notes: SongNote[];
}

/**
 * Parse a note length in LilyPond style: `1 2 4 8 16` (whole … sixteenth), optional dot (`4.`), and `+` to tie
 * lengths together (`4+16`). Returns beats (quarter note = 1).
 */
export function parseLength(tok: string): number {
  let beats = 0;
  for (const part of tok.split("+")) {
    const m = /^(1|2|4|8|16)(\.?)$/.exec(part);
    if (!m) throw new Error(`Bad note length "${tok}"`);
    beats += (4 / Number(m[1])) * (m[2] ? 1.5 : 1);
  }
  return beats;
}

/**
 * Parse song lines. Token format `syllable|notes`, e.g. `Mar-|C tin|DE`.
 * Two letters = two notes on one syllable; `_` is a space inside a syllable.
 * Lowercase `c d e f` are the high bars.
 *
 * `rhythm` has one line per song line, with one length per note (see parseLength) and optional rests
 * (`r4`) after a note, e.g. `4 4 8 8 2 r4`.
 */
export function build(lines: string[], rhythm: string[]): SongNote[] {
  if (rhythm.length !== lines.length)
    throw new Error(`${lines.length} lines but ${rhythm.length} rhythm lines`);
  const out: SongNote[] = [];
  lines.forEach((line, li) => {
    const lens = (rhythm[li] ?? "").trim().split(/\s+/);
    let count = 0;
    const li0 = out.length;
    for (const tok of line.trim().split(/\s+/)) {
      const [s, n, ...rest] = tok.split("|");
      if (s === undefined || !n || rest.length) throw new Error(`Bad token "${tok}" in line ${li + 1}`);
      [...n].forEach((ch, i) => {
        if (!isNoteName(ch)) throw new Error(`Unknown note "${ch}" in token "${tok}"`);
        out.push({ s: i === 0 ? s.replace(/_/g, " ") : "～", n: ch, line: li, beats: 0, rest: 0 });
      });
    }
    for (const t of lens) {
      if (t.startsWith("r")) {
        const prev = out[li0 + count - 1];
        if (!prev || count === 0) throw new Error(`Rest before the first note in rhythm line ${li + 1}`);
        prev.rest += parseLength(t.slice(1));
        continue;
      }
      const note = out[li0 + count];
      if (!note || note.line !== li) throw new Error(`Rhythm line ${li + 1} has more lengths than notes`);
      note.beats = parseLength(t);
      count++;
    }
    if (li0 + count !== out.length) throw new Error(`Rhythm line ${li + 1} has fewer lengths than notes`);
  });
  return out;
}

export const SONGS = {
  froh: {
    icon: "🥜",
    title: "Lasst uns froh und munter sein",
    bpm: 128,
    // Rhythm: German Wikipedia (LilyPond)
    notes: build(
      [
        "Lasst|G uns|G froh|GA und|GF mun-|E ter|E sein,|E",
        "und|F uns|F recht|FG von|FE Her-|D zen|D freun!|D",
        "Lus-|C tig,|D lus-|E tig,|F tra-le-|GA ra-le-|GA ra,|G",
        "bald|c ist|G Ni-|GA ko-|GF laus-|E a-bend|D da,|G",
        "bald|c ist|G Ni-|GA ko-|GF laus-|E a-bend|D da!|C",
      ],
      [
        "4 4 8 8 8 8 4 4 4 r4",
        "4 4 8 8 8 8 4 4 4 r4",
        "4 4 4 4 8 8 8 8 4 r4",
        "4 4 8 8 8 8 4 4 4 r4",
        "4 4 8 8 8 8 4 4 4",
      ],
    ),
  },
  jingle: {
    icon: "❄️",
    title: "Jingle Bells",
    bpm: 100,
    // Rhythm: lieder-archiv.de MIDI/MusicXML 200202 (chorus)
    notes: build(
      [
        "Jin-|E gle|E bells,|E jin-|E gle|E bells,|E",
        "jin-|E gle|G all|C the|D way!|E",
        "Oh|F what|F fun|F it|F is|F to|E ride|E in|E a|E",
        "one-|E horse|D o-|D pen|E sleigh,|D hey!|G",
        "Jin-|E gle|E bells,|E jin-|E gle|E bells,|E",
        "jin-|E gle|G all|C the|D way!|E",
        "Oh|F what|F fun|F it|F is|F to|E ride|E in|E a|E",
        "one-|G horse|G o-|F pen|D sleigh!|C",
      ],
      [
        "8 8 4 8 8 4",
        "8 8 8. 16 4. r8",
        "8 8 8. 16 8 8 8 16 16",
        "8 8 8 8 8 4+16 r8",
        "8 8 4 8 8 4",
        "8 8 8. 16 4. r8",
        "8 8 8. 16 8 8 8 16 16",
        "8 8 8 8 4.",
      ],
    ),
  },
  weihnachtsmann: {
    icon: "🎅",
    title: "Morgen kommt der Weihnachtsmann",
    bpm: 120,
    // Rhythm: lieder-archiv.de MIDI 200018
    notes: build(
      [
        "Mor-|C gen|C kommt|G der|G Weih-|A nachts-|A mann,|G",
        "kommt|F mit|F sei-|E nen|E Ga-|DD ben.|C",
        "Trom-|G mel,|G Pfei-|F fe|F und|E Ge-|E wehr,|D",
        "Fahn|G und|G Sä-|F bel|F und|E noch|E mehr,|D",
        "ja|C ein|C gan-|G zes|G Krie-|A ges-|A heer,|G",
        "möcht|F ich|F ger-|E ne|E ha-|DD ben.|C",
      ],
      [
        "4 4 4 4 4 4 2",
        "4 4 4 4 4 4 4 r4",
        "4 4 4 4 4 4 2",
        "4 4 4 4 4 4 2",
        "4 4 4 4 4 4 2",
        "4 4 4 4 4 4 2",
      ],
    ),
  },
  // The next three songs stay within C–c (notes taken from the sheet music / MIDI in C major).
  jahre: {
    icon: "🎄",
    title: "Alle Jahre wieder",
    bpm: 120,
    // Rhythm: lieder-archiv.de MIDI 200009
    notes: build(
      [
        "Al-|G le|A Jah-|G re|F wie-|E der,|D kommt|C das|DE Chris-|F tus-|E kind|D",
        "auf|E die|G Er-|A de|G nie-|c der,|HA wo|G wir|FE Men-|F schen|G sind.|E",
      ],
      ["4. 8 4 4 2 2 4 8 8 4 4 2. r4", "4 4 4 4 2 4 4 4 8 8 4 4 2."],
    ),
  },
  kinderlein: {
    icon: "👶",
    title: "Ihr Kinderlein, kommet",
    bpm: 112,
    // Rhythm: lieder-archiv.de MIDI 200066
    notes: build(
      [
        "Ihr|G Kin-|G der-|E lein,|G kom-|G met,|E o|G kom-|F met|D doch|F all!|E",
        "Zur|G Krip-|G pe|E her|G kom-|G met|E in|G Beth-|F le-|D hems|F Stall.|E",
        "Und|E seht,|D was|D in|D die-|F ser|F hoch-|F hei-|E li-|E gen|E Nacht|A",
        "der|A Va-|G ter|G im|G Him-|c mel|G für|E Freu-|G de|F uns|D macht.|C",
      ],
      [
        "8 4 8 8 4 8 8 4 8 8 4 r8",
        "8 4 8 8 4 8 8 4 8 8 4 r8",
        "8 4 8 8 4 8 8 4 8 8 4.",
        "8 4 8 8 4 8 8 4 8 8 4",
      ],
    ),
  },
  // Note: in the verse "Öffnet mir die Türen" the original has an F♯ (not on the glockenspiel); it is played as F here.
  kling: {
    icon: "🔔",
    title: "Kling, Glöckchen",
    bpm: 96,
    // Rhythm: lieder-archiv.de MIDI 200076
    notes: build(
      [
        "Kling,|G Glöck-|E chen,|F klin-|G ge-|A lin-|G ge-|A ling,|G kling,|F Glöck-|D chen,|G kling!|E",
        "Lasst|D mich|D ein,|E ihr|C Kin-|E der,|D ist|F so|F kalt|G der|D Win-|F ter!|E",
        "Öff-|D net|D mir|E die|F Tü-|G ren,|D lasst|E mich|A nicht|G er-|F frie-|A ren!|G",
        "Kling,|G Glöck-|E chen,|F klin-|G ge-|A lin-|G ge-|A ling,|G kling,|F Glöck-|D chen,|G kling!|E",
      ],
      [
        "4 8 8 16 16 16 16 4 4 8 8 4 r4",
        "8 8 8 8 4 4 8 8 8 8 4 4",
        "8 8 8 8 4 4 8 8 8 8 4 4",
        "4 8 8 16 16 16 16 4 4 8 8 4",
      ],
    ),
  },
  // From here on the songs are played in G major (no F♯) and use the high bars. Notes from Wikibooks/Wikipedia LilyPond.
  jakob: {
    icon: "😴",
    title: "Bruder Jakob",
    bpm: 120,
    // Rhythm: lieder-archiv.de MIDI 100145 (first voice)
    notes: build(
      [
        "Bru-|G der|A Ja-|H kob,|G Bru-|G der|A Ja-|H kob,|G",
        "schläfst|H du|c noch?|d schläfst|H du|c noch?|d",
        "Hörst|d du|e nicht|d die|c Glo-|H cken?|G Hörst|d du|e nicht|d die|c Glo-|H cken?|G",
        "Ding,|G dang,|D dong.|G Ding,|G dang,|D dong.|G",
      ],
      ["4 4 4 4 4 4 4 4", "4 4 2 4 4 2", "8 8 8 8 4 4 8 8 8 8 4 4", "4 4 2 4 4 2"],
    ),
  },
  // Beethoven/Schiller. "al-" is tied in the original (syncopation); it is struck only once here.
  freude: {
    icon: "🎆",
    title: "Freude, schöner Götterfunken",
    bpm: 120,
    // Rhythm: lieder-archiv.de MIDI 300600
    notes: build(
      [
        "Freu-|H de,|H schö-|c ner|d Göt-|d ter-|c fun-|H ken,|A Toch-|G ter|G aus|A E-|H ly-|H si-|A um,|A",
        "wir|H be-|H tre-|c ten|d feu-|d er-|c trun-|H ken,|A Himm-|G li-|G sche,|A dein|H Hei-|A lig-|G tum!|G",
        "Dei-|A ne|A Zau-|H ber|G bin-|A den|Hc wie-|H der,|G was|A die|Hc Mo-|H de|A streng|G ge-|A teilt;|D",
        "al-|H le|H Men-|c schen|d wer-|d den|c Brü-|H der,|A wo|G dein|G sanf-|A ter|H Flü-|A gel|G weilt.|G",
      ],
      [
        "4 4 4 4 4 4 4 4 4 4 4 4 4. 8 2",
        "4 4 4 4 4 4 4 4 4 4 4 4 4. 8 2",
        "4 4 4 4 4 8 8 4 4 4 8 8 4 4 4 4 4",
        "2 4 4 4 4 4 4 4 4 4 4 4 4. 8 2",
      ],
    ),
  },
} satisfies Record<string, Song>;

export type SongKey = keyof typeof SONGS;
export const SONG_KEYS = Object.keys(SONGS) as SongKey[];
