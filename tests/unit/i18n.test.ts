import { describe, expect, it } from "vitest";
import { DEFAULT_LANG, LANGS, barName, getLang, isLang, setLang, t } from "../../src/i18n";
import { ORDER } from "../../src/notes";

describe("DEFAULT_LANG", () => {
  it("is German", () => {
    expect(DEFAULT_LANG).toBe("de");
    expect(getLang()).toBe("de");
  });
});

describe("t", () => {
  it("translates and fills placeholders", () => {
    expect(t("done.text", undefined, "de")).toBe("Super gemacht!");
    expect(t("done.text", undefined, "en")).toBe("Well done!");
    expect(t("cal.progress", { n: 3, total: 11 }, "en")).toBe("Calibrating 3/11");
    expect(t("cal.progress", { n: 3, total: 11 }, "de")).toBe("Kalibrieren 3/11");
  });
  it("uses the current language by default", () => {
    setLang("de");
    expect(getLang()).toBe("de");
    expect(t("ctl.home")).toBe("Lieder");
    setLang("en");
    expect(t("ctl.home")).toBe("Songs");
  });
  it("keeps the same placeholders in every language", () => {
    const keys = ["preview.label", "color.left", "color.right", "cal.progress", "cal.heard"] as const;
    const names = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of keys) expect(names(t(k, undefined, "de"))).toEqual(names(t(k, undefined, "en")));
  });
});

describe("barName", () => {
  it("names every bar in both languages", () => {
    for (const lang of LANGS) {
      setLang(lang);
      for (const n of ORDER) expect(barName(n).length).toBeGreaterThan(0);
    }
  });
  it("tells low and high bars of the same color apart", () => {
    setLang("de");
    expect(barName("D")).toBe("Braun");
    expect(barName("D", true)).toBe("Braun links");
    expect(barName("d")).toBe("Braun rechts");
    setLang("en");
    expect(barName("D")).toBe("Brown");
    expect(barName("D", true)).toBe("Brown left");
    expect(barName("d")).toBe("Brown right");
  });
});

describe("isLang", () => {
  it("accepts only supported languages", () => {
    expect(isLang("en")).toBe(true);
    expect(isLang("de")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
