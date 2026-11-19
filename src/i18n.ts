import { COL, isHigh, type NoteName } from "./notes";

/**
 * Minimal i18n for the UI. Only the interface is translated; song titles and lyrics stay as they are.
 * Pure (no DOM access except `applyStatic`), so it can be unit-tested.
 */

export const LANGS = ["en", "de"] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (x: unknown): x is Lang => (LANGS as readonly unknown[]).includes(x);

/** Flag shown in the language switcher, and the language's own name (used as accessible name). */
export const LANG_INFO: Readonly<Record<Lang, { flag: string; name: string; speech: string }>> = {
  en: { flag: "🇬🇧", name: "English", speech: "en-GB" },
  de: { flag: "🇩🇪", name: "Deutsch", speech: "de-DE" },
};

/** Language used until the user picks one. */
export const DEFAULT_LANG: Lang = "de";

const de = {
  "app.title": "Mein Glockenspiel",
  "app.description": "Glockenspiel-Lieder lernen mit Farben und Mikrofon",
  "lang.label": "Sprache",
  "gear.title": "Eltern-Bereich (gedrückt halten)",
  "gear.label": "Eltern-Bereich",
  "gear.hint": "⚙ Zum Öffnen gedrückt halten",
  "big.title": "Antippen = weiter",
  "cal.cancel": "✖ Kalibrierung abbrechen",
  "done.text": "Super gemacht!",
  "done.again": "🔁 Nochmal!",
  "play.song": "Ganzes Lied vorspielen",
  "play.stop": "Vorspielen stoppen",
  "speed.group": "Tempo",
  "speed.slower": "Langsamer",
  "speed.normal": "Normales Tempo",
  "speed.faster": "Schneller",
  "ctl.home": "Lieder",
  "ctl.mic": "Zuhören",
  "ctl.play": "Vorspielen",
  "ctl.restart": "🔁 Von vorn",
  "set.title": "⚙️ Eltern-Bereich",
  "set.auto": "Ton automatisch vorspielen",
  "set.speak": "Farbe vorlesen",
  "set.staff": "Noten anzeigen",
  "set.sens": "Empfindlichkeit",
  "set.back": "⬅️ Einen Ton zurück",
  "set.cal": "🎯 Kalibrieren",
  "set.calAgain": "🎯 Neu kalibrieren",
  "set.calStop": "✖ Kalibrierung abbrechen",
  "set.calReset": "🗑 Kalibrierung löschen",
  "set.clearAll": "🧹 Alle gespeicherten Daten löschen",
  "set.close": "Schließen",
  "set.calSaved": "Kalibrierung gespeichert.",
  "set.calNone": "Keine Kalibrierung gespeichert.",
  "set.calDeleted": "Kalibrierung gelöscht.",
  "set.cleared": "Alle gespeicherten Daten gelöscht.",
  "preview.label": "Vorschau {name}",
  "color.green": "Grün",
  "color.brown": "Braun",
  "color.red": "Rot",
  "color.yellow": "Gelb",
  "color.grey": "Grau",
  "color.blue": "Blau",
  "color.lilac": "Lila",
  "color.left": "{color} links",
  "color.right": "{color} rechts",
  "next.label": "danach",
  "cal.progress": "Kalibrieren {n}/{total}",
  "cal.hintStrike": "Schlag diesen Stab einzeln an (Kreis antippen = überspringen)",
  "cal.notHeard": "Nicht erkannt – nochmal anschlagen",
  "cal.heard": "{hz} Hz ✓",
  "cal.done": "Kalibriert ✓ – die App erkennt jetzt dein Glockenspiel.",
  "mic.listening": "Ich höre zu – spiel den Ton!",
  "mic.denied":
    "Das Mikrofon ist hier nicht erlaubt. Öffne die Seite im Browser (z.\u00a0B. Chrome), dann hört die App zu. Bis dahin: großen Kreis antippen.",
} as const;

export type MessageKey = keyof typeof de;

const en: Record<MessageKey, string> = {
  "app.title": "My Glockenspiel",
  "app.description": "Learn glockenspiel songs with colors and the microphone",
  "lang.label": "Language",
  "gear.title": "Parent area (press and hold)",
  "gear.label": "Parent area",
  "gear.hint": "⚙ Press and hold to open",
  "big.title": "Tap = next",
  "cal.cancel": "✖ Cancel calibration",
  "done.text": "Well done!",
  "done.again": "🔁 Again!",
  "play.song": "Play the whole song",
  "play.stop": "Stop playing",
  "speed.group": "Speed",
  "speed.slower": "Slower",
  "speed.normal": "Normal speed",
  "speed.faster": "Faster",
  "ctl.home": "Songs",
  "ctl.mic": "Listen",
  "ctl.play": "Play note",
  "ctl.restart": "🔁 Restart",
  "set.title": "⚙️ Parent area",
  "set.auto": "Play the tone automatically",
  "set.speak": "Read the color aloud",
  "set.staff": "Show staff notation",
  "set.sens": "Sensitivity",
  "set.back": "⬅️ One note back",
  "set.cal": "🎯 Calibrate",
  "set.calAgain": "🎯 Calibrate again",
  "set.calStop": "✖ Cancel calibration",
  "set.calReset": "🗑 Delete calibration",
  "set.clearAll": "🧹 Delete all saved data",
  "set.close": "Close",
  "set.calSaved": "Calibration saved.",
  "set.calNone": "No calibration saved.",
  "set.calDeleted": "Calibration deleted.",
  "set.cleared": "All saved data deleted.",
  "preview.label": "Preview {name}",
  "color.green": "Green",
  "color.brown": "Brown",
  "color.red": "Red",
  "color.yellow": "Yellow",
  "color.grey": "Grey",
  "color.blue": "Blue",
  "color.lilac": "Lilac",
  "color.left": "{color} left",
  "color.right": "{color} right",
  "next.label": "next",
  "cal.progress": "Calibrating {n}/{total}",
  "cal.hintStrike": "Strike this bar on its own (tap the circle to skip)",
  "cal.notHeard": "Not recognized – strike it again",
  "cal.heard": "{hz} Hz ✓",
  "cal.done": "Calibrated ✓ – the app now recognizes your glockenspiel.",
  "mic.listening": "I'm listening – play the note!",
  "mic.denied":
    "The microphone is not allowed here. Open the page in a browser (e.g. Chrome) so the app can listen. Until then, tap the big circle.",
};

const MESSAGES: Record<Lang, Record<MessageKey, string>> = { de, en };

export type Params = Record<string, string | number>;

let current: Lang = DEFAULT_LANG;

export const getLang = (): Lang => current;
export const setLang = (l: Lang): void => {
  current = l;
};

/** Translate `key` into the current language and fill `{placeholders}`. */
export function t(key: MessageKey, params?: Params, lang: Lang = current): string {
  const text = MESSAGES[lang][key];
  return params ? text.replace(/\{(\w+)\}/g, (m, k: string) => String(params[k] ?? m)) : text;
}

/**
 * Color name of a bar in the UI language. High bars say "right"; a low bar says "left" only when `left` is set
 * (the song also uses its high twin, so the two must be told apart).
 */
export function barName(n: NoteName, left = false): string {
  const color = t(`color.${COL[n].color}`);
  if (isHigh(n)) return t("color.right", { color });
  return left ? t("color.left", { color }) : color;
}

/** Message keys of the translatable markup attributes, e.g. `data-i18n="done.text"`. */
const ATTRS = [
  ["data-i18n", "textContent"],
  ["data-i18n-title", "title"],
  ["data-i18n-label", "aria-label"],
] as const;

/**
 * Translate all marked elements in the page, and the page language/title/description.
 * `titleSuffix` is appended to the title (the label of pull-request previews, e.g. "PR 12").
 */
export function applyStatic(titleSuffix?: string): void {
  for (const [attr, target] of ATTRS) {
    document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
      const text = t(el.getAttribute(attr) as MessageKey);
      if (target === "textContent") el.textContent = text;
      else el.setAttribute(target, text);
    });
  }
  document.documentElement.lang = current;
  document.title = titleSuffix ? `${t("app.title")} (${titleSuffix})` : t("app.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
}
