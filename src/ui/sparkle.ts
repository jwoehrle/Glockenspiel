const SPARKS = ["⭐", "✨", "🌟"];

/** Praise burst: eight stars flying outwards from the circle. */
export function sparkle(box: HTMLElement): void {
  for (let i = 0; i < 8; i++) {
    const e = document.createElement("span");
    const a = (i / 8) * 2 * Math.PI + Math.random() * 0.5;
    const r = 80 + Math.random() * 60;
    e.textContent = SPARKS[i % SPARKS.length] ?? "⭐";
    e.style.setProperty("--dx", Math.cos(a) * r + "px");
    e.style.setProperty("--dy", Math.sin(a) * r + "px");
    box.appendChild(e);
    setTimeout(() => e.remove(), 900);
  }
}
