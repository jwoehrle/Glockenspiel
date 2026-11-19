import { COL, isHigh, label, type NoteName } from "../notes";

/**
 * Staff notation (treble clef, C major, no accidentals).
 *
 * Children's glockenspiel books write the bars without extra ledger lines, an octave below the sounding pitch:
 * the lowest bar C is written as c'' (C5, third space), the highest bar f as f''' (F6, three ledger lines).
 * A "step" is one diatonic step (a line or a space); step 0 = middle C (C4), step 7 = C5.
 */

const LETTERS = ["C", "D", "E", "F", "G", "A", "H"] as const;

/** Written step of the lowest bar (C5). */
const BASE_STEP = 7;
/** Step of the bottom staff line (E4). Lines are on steps 2, 4, 6, 8, 10; steps in between are spaces. */
const BOTTOM_LINE_STEP = 2;
const TOP_LINE_STEP = 10;

/** Written staff step of a bar. Strictly increasing from C (7) to f (17). */
export const staffStep = (n: NoteName): number => {
  const letter = LETTERS.indexOf(label(n) as (typeof LETTERS)[number]);
  return BASE_STEP + letter + (isHigh(n) ? 7 : 0);
};

/** Even steps of the ledger lines a note at `step` needs (empty for notes inside or just above the staff). */
export const ledgerSteps = (step: number): number[] => {
  const out: number[] = [];
  for (let s = TOP_LINE_STEP + 2; s <= step; s += 2) out.push(s);
  for (let s = BOTTOM_LINE_STEP - 2; s >= step; s -= 2) out.push(s);
  return out;
};

// Drawing geometry (SVG user units). One step = HALF units, so a line gap is 2 * HALF.
const HALF = 5;
const BOTTOM_Y = 80;
const stepY = (step: number): number => BOTTOM_Y - (step - BOTTOM_LINE_STEP) * HALF;
const CUR_X = 66;
const NEXT_X = 94;

const lines = [2, 4, 6, 8, 10]
  .map((s) => `<line x1="2" x2="110" y1="${stepY(s)}" y2="${stepY(s)}"/>`)
  .join("");

/** Treble clef drawn as one stroked path (music fonts are not reliably installed on children's tablets). */
const CLEF =
  '<path class="clef" d="M 24 88 C 22 98 36 98 34 86 L 30 28 C 29 14 38 6 41 10 C 44 16 36 34 28 46 C 14 62 14 80 30 80 C 44 80 46 62 32 58 C 22 55 18 68 26 70"/>';

/** One quarter note: head in the bar's color, ledger lines, stem down (all notes sit above the middle line). */
function noteSvg(n: NoteName, x: number, cls: string): string {
  const step = staffStep(n);
  const y = stepY(step);
  const ledgers = ledgerSteps(step)
    .map((s) => `<line class="ledger" x1="${x - 10}" x2="${x + 10}" y1="${stepY(s)}" y2="${stepY(s)}"/>`)
    .join("");
  return (
    `<g class="${cls}" data-note="${n}" data-step="${step}">${ledgers}` +
    `<line class="stem" x1="${x - 6.2}" x2="${x - 6.2}" y1="${y + 1}" y2="${y + 3.5 * 2 * HALF}"/>` +
    `<ellipse class="head" cx="${x}" cy="${y}" rx="7" ry="5" transform="rotate(-20 ${x} ${y})" fill="${COL[n].hex}"/>` +
    `</g>`
  );
}

/** Show the current note (in color) and the next one (faded). `null` clears the staff. */
export function renderStaff(box: HTMLElement, cur: NoteName | null, next: NoteName | null): void {
  box.classList.toggle("idle", cur === null);
  if (cur === null) {
    box.innerHTML = "";
    box.removeAttribute("aria-label");
    return;
  }
  box.setAttribute("aria-label", `Notenschrift: ${label(cur)}`);
  box.innerHTML =
    `<svg viewBox="0 -4 112 108" aria-hidden="true" focusable="false">` +
    `<g class="staff-lines">${lines}</g>${CLEF}` +
    (next ? noteSvg(next, NEXT_X, "next-note") : "") +
    noteSvg(cur, CUR_X, "cur-note") +
    `</svg>`;
}
