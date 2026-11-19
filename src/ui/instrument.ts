import { barName } from "../i18n";
import { COL, ORDER, isHigh, label, type NoteName } from "../notes";

/** Bar lengths shrink towards the high end, like on the real instrument (100 % → 72 %). */
const barLength = (i: number): number => 100 - (i * 28) / (ORDER.length - 1);

/**
 * Draw the eleven bars once, left to right in the real order and colors. Each bar is a button, so the song
 * can be played without a real glockenspiel.
 */
export function renderInstrument(box: HTMLElement, onTap: (n: NoteName) => void): void {
  box.innerHTML = "";
  ORDER.forEach((n, i) => {
    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = "bar";
    bar.dataset.note = n;
    bar.setAttribute("aria-label", barName(n));
    bar.style.background = COL[n].hex;
    bar.style.height = `${barLength(i)}%`;
    bar.innerHTML = `<i></i><i></i><span>${label(n)}${isHigh(n) ? "★" : ""}</span>`;
    bar.addEventListener("click", () => onTap(n));
    box.appendChild(bar);
  });
}

/** Let the bar to strike pop out; null = no bar (finish screen). */
export function highlightBar(box: HTMLElement, n: NoteName | null): void {
  box.classList.toggle("idle", n === null);
  for (const bar of box.children as HTMLCollectionOf<HTMLElement>) {
    bar.classList.toggle("on", bar.dataset.note === n);
  }
}

/** Short "struck" animation on a bar. */
export function strikeBar(box: HTMLElement, n: NoteName): void {
  const bar = box.querySelector<HTMLElement>(`.bar[data-note="${n}"]`);
  if (!bar) return;
  bar.classList.remove("struck");
  void bar.offsetWidth;
  bar.classList.add("struck");
}
