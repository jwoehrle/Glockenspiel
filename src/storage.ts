import { DEFAULT_SPEED, isSpeed, type Speed } from "./audio/speed";
import { detectLang, isLang, type Lang } from "./i18n";
import { normalizeCalibration, type Calibration } from "./mic/detect";

// Previews live on the same origin as the live site, so they get their own keys (the live site keeps the
// original ones, so existing calibrations and options stay).
const NS = import.meta.env.VITE_PREVIEW ? `@${import.meta.env.BASE_URL}` : "";
export const CAL_KEY = `glock-cal${NS}`;
export const OPT_KEY = `glock-opts${NS}`;

export interface Options {
  /** Play the tone of each new note automatically. */
  auto: boolean;
  /** Read the color aloud. */
  speak: boolean;
  /** Show the current and next note in staff notation next to the circle. */
  staff: boolean;
  /** Speed of ▶ (whole song), as a factor of the song's tempo. */
  speed: Speed;
  /** UI language (songs keep their own language). */
  lang: Lang;
}

/** Language of the browser if supported, English otherwise. */
const browserLang = (): Lang => detectLang(typeof navigator === "undefined" ? [] : navigator.languages);

export const OPT_DEFAULTS: Readonly<Options> = {
  auto: false,
  speak: false,
  staff: false,
  speed: DEFAULT_SPEED,
  lang: browserLang(),
};

// localStorage can throw (private mode, quota, disabled storage); the app must keep working without it.

export function loadCal(): Calibration | null {
  try {
    return normalizeCalibration(JSON.parse(localStorage.getItem(CAL_KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function saveCal(cal: Calibration | null): void {
  try {
    if (cal) localStorage.setItem(CAL_KEY, JSON.stringify(cal));
    else localStorage.removeItem(CAL_KEY);
  } catch {
    /* ignore */
  }
}

export function loadOpts(): Options {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(OPT_KEY) ?? "{}");
    const r = (o && typeof o === "object" ? o : {}) as Partial<Record<keyof Options, unknown>>;
    return {
      auto: typeof r.auto === "boolean" ? r.auto : OPT_DEFAULTS.auto,
      speak: typeof r.speak === "boolean" ? r.speak : OPT_DEFAULTS.speak,
      staff: typeof r.staff === "boolean" ? r.staff : OPT_DEFAULTS.staff,
      speed: isSpeed(r.speed) ? r.speed : OPT_DEFAULTS.speed,
      lang: isLang(r.lang) ? r.lang : OPT_DEFAULTS.lang,
    };
  } catch {
    return { ...OPT_DEFAULTS };
  }
}

export function saveOpts(opts: Options): void {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify(opts));
  } catch {
    /* ignore */
  }
}

/** Remove this site's data only (never the live site's data from a preview, or the other way round). */
export function clearAll(): void {
  try {
    localStorage.removeItem(CAL_KEY);
    localStorage.removeItem(OPT_KEY);
  } catch {
    /* ignore */
  }
}
