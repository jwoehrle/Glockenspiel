# AGENTS.md

Guidance for AI agents continuing development in a fresh session. Read this first, then `README.md`.

## What this is

"Mein Glockenspiel": a single-page web app (German UI) that teaches a young child (about 6 years old) songs on a
diatonic glockenspiel with eleven color-coded bars (Sonor GS Toysound, c3–f4: C D E F G A H c d e f). Colors left
to right: green, brown, red, yellow, grey, blue, lilac, then green, brown, red, yellow again for the high c d e f. It
shows the next note as a colored circle and listens through the microphone to check that the right bar was struck.
Hosted on GitHub Pages, installable as a PWA.

- Live: https://jwoehrle.github.io/Glockenspiel/
- Stack: **TypeScript (strict) + Vite**, no UI framework. `vite-plugin-pwa` (Workbox, `injectManifest`) builds the
  service worker and the manifest. Vitest for unit tests, Playwright for end-to-end tests.
- Deployment: `.github/workflows/pages.yml` publishes via the `gh-pages` branch (Pages source = branch
  `gh-pages`, root). Push to `main` → tests → live site at the root (keeps `pr-preview/`). Pull request → tests →
  preview at `/Glockenspiel/pr-preview/pr-<n>/` with a PR comment (`rossjrw/pr-preview-action`); closing the PR
  removes it. Nothing is published if a test fails. Preferred flow: feature branch → PR → try the preview → merge.
- Previews are built with `BASE_PATH=/Glockenspiel/pr-preview/pr-<n>/ VITE_PREVIEW="PR <n>"`: they show a
  "Vorschau" label, use their own `localStorage` keys (`glock-cal@<base>`; the live site keeps the original keys) and
  manifest name. The live service worker must not answer preview URLs: its navigation route has a denylist for
  `/pr-preview/` (tested in `tests/e2e-preview/`; the test fails without it). "Clear all data" only removes the
  current site's keys.

## Working rules

- **Do not commit or push unless the user asks.** They request it explicitly each time.
- **Before any push, run the full test suite locally, including the Playwright e2e tests**
  (`npm run check && npm run test:e2e && npm run test:e2e:preview`).
- **Never rewrite git history or force-push without an explicit request.** (It was done once, deliberately, to remove a personal name.)
- **Privacy:** the app and repo must not contain the child's name or other personal details. Keep text generic ("My Glockenspiel", "Well done!").
- The UI is **English and German** (`src/i18n.ts`); song titles and lyrics are not translated. Everything else (code,
  identifiers, comments, tests, commit messages, docs) is **English**. See `.kiro/steering/tech.md`.
- The default language is **English**. Answer in German only when the user writes in German.
- No manual cache version bump is needed anymore: the service worker precaches hashed assets, and a new build produces a new worker.

## Commands

```bash
npm install            # once
npm run dev            # dev server with hot reload: http://localhost:5173/Glockenspiel/
npm run check          # type-check, lint, format check, unit tests
npm run test:e2e       # builds, serves the production build on :4173, runs Playwright (Chromium)
npm run test:e2e:preview  # gh-pages layout: live site + PR preview on one origin (:4174), tests both
npm run build          # type-check + production build into dist/
npm run preview        # serve dist/ at http://localhost:4173/Glockenspiel/
npm run format         # prettier --write
```

The service worker is only active in the production build (`build` + `preview`), not in `dev`.
Stop dev/preview servers when done.

## Code map

- `index.html`: markup only (Vite entry). Loads `src/main.ts`.
- `src/notes.ts`: `ORDER`, `NoteName` type, `COL` (color, German name, MIDI number; C = 84), `FREQ` (derived),
  `isHigh`, `label`, `highTwin`. Lowercase keys are the high bars, shown as an uppercase letter with a ★. The low twin
  of a high bar is labelled "links" when the song also uses the high one.
- `src/songs.ts`: `SONGS` + `build(lines, rhythm)`. Token format `syllable|notes`, e.g. `Mar-|C tin|DE`. Lowercase
  `c d e f` = high bars. Two letters = two notes on one syllable; `_` is a space inside a syllable. `rhythm` has one
  line per song line with one LilyPond-style length per note (`1 2 4 8 16`, dot `4.`, tie `4+16`) and optional rests
  after a note (`r4`). Each song has `bpm` (quarter notes per minute, from the source). `build()` throws on unknown
  notes, bad lengths or a length count that does not match the notes, so mistakes fail the unit tests.
- `src/app.ts`: state and UI flow: `setMode("home"|"play")`, `renderSongs`, `renderTrack`, `show`, `next`, `miss`,
  `announce` (optional read-aloud + autoplay), calibration (`calHit`, `calAdvance`, `endCal`), parent area wiring.
- `src/mic/pitch.ts` (pure): `cents`, `freqToMidi`, `nearestMidi`, `rms`, `peakFreqs` (spectral peak picking).
- `src/mic/detect.ts` (pure): `judge()` (hit / miss / none), `calibrationPeak`, `normalizeCalibration`.
- `src/mic/onset.ts` (pure): `OnsetDetector` (onset detection, `block(ms)` to mute while the app makes sound).
- `src/mic/mic.ts`: `Mic` class: getUserMedia, AnalyserNode, animation-frame loop; calls `onStrike(freqs)`.
- `src/audio/bell.ts`: shared `AudioContext`, synthesized bell tone.
- `src/audio/player.ts`: `schedule()` (pure: note onsets in ms) and `SongPlayer` (timers from one start time).
  `playSong()`/`stopSong()` in `app.ts`: ▶ plays the whole song from the start; circle, track and glockenspiel
  follow every note; the microphone is muted; any other interaction (circle, bar, track, 🔊, 🔁, 🏠, calibration)
  stops it. Afterwards the song is back at the first note.
- `src/audio/speed.ts` (pure): `SPEEDS` ½× ¾× 1× 1¼× 1½×, `slower`/`faster` (stop at the ends). Saved in the
  options as `speed`. ▶ plays at `bpm × speed`. Changing the speed during playback does **not** stop it (the one
  exception to "any interaction stops it"): the song goes on at the new tempo with the next note (`scheduleFrom`).
- `src/i18n.ts`: `en`/`de` message tables, `t(key, params)`, `barName()` (color name incl. "left"/"right"),
  `applyStatic()` (fills `data-i18n`, `data-i18n-title`, `data-i18n-label` elements, `<html lang>`, title,
  description), Texts set from code use `say(id, key)` in `app.ts`, which remembers them so a language
  switch re-translates them (`applyLanguage()`). The `<select id="lang">` (flags 🇬🇧 🇩🇪) sits left of the ⚙; the choice
  is saved in the options (`lang`), German is the default (`DEFAULT_LANG`, not the browser language). The web app manifest stays
  German-only (it is static). Speech uses `en-GB` or `de-DE`.
- `src/storage.ts`: `localStorage` keys `glock-cal` (calibration) and `glock-opts` (options); never throws.
- `src/ui/instrument.ts`: the whole glockenspiel under the circle (`renderInstrument`, `highlightBar`,
  `strikeBar`); the bar to strike pops out, and the bars are buttons (`tapBar` in `app.ts`). Two layouts in
  `style.css`: tablet portrait (portrait, ≥ 700 × 800 px) shows it below the circle; landscape ≥ 900 × 600 px
  (laptops, tablet landscape) uses a grid with the circle column left and the glockenspiel right, track and controls
  below, without scrolling at 1280 × 640. Below the track: `.dock` with the playback rows (`.playback`: ▶ alone, then
  🐌 1× 🏎) and the other `.controls`; stacked in portrait, side by side in landscape (smaller ▶ and speed buttons). Hidden on phones (portrait and landscape) and on the finish screen.
- `src/ui/staff.ts`: staff notation (treble clef, C major, no accidentals). `staffStep` (C = c'' = step 7 ... f = f''' = step 17,
  written an octave below the sounding pitch like children's glockenspiel books), `ledgerSteps`, `renderStaff` (current note in
  the bar's color plus the next one faded). Clef is a hand-drawn SVG path (music fonts are not reliably installed). Parent option
  "Noten anzeigen" (`staff`, off by default) adds `notation` to `body.className`; shown left of the circle on tablet portrait and
  landscape layouts (3-column grid), hidden on phones and the finish screen.
- `src/ui/dom.ts`, `src/ui/sparkle.ts`, `src/style.css`.
- `src/sw.ts`: service worker (precache, offline navigation fallback, deletes old `glock-v*` caches from the
  pre-build era). Served at `/Glockenspiel/sw.js`, the same URL as the old hand-written worker.
- `vite.config.ts`: `base: "/Glockenspiel/"`, PWA manifest, Vitest config. `public/icons/`: app icons.
- Parent area: `<dialog id="settings">`, opened by **press-and-hold (~0.8 s)** on the faint ⚙ top-right (keyboard:
  Enter), so the child can't open it by accident. A short click shows a hint ("⚙ Zum Öffnen gedrückt halten", `#gearhint`, 3 s) instead of doing nothing.

## Tests

- `tests/unit/*.test.ts` (Vitest): song data (valid bars, unique icons/titles, exact sequences of verified songs),
  `build()`, bars/frequencies, pitch math, peak picking on synthetic spectra, `judge()` incl. octave-specific
  matching and calibration, onset detector timing, playback schedule (`player.test.ts`), speed steps
  (`speed.test.ts`), staff steps and ledger lines (`staff.test.ts`), translations (`i18n.test.ts`).
- `tests/e2e/*.spec.ts` (Playwright, Chromium, against the production build). Most tests look for German UI text, which
  is the default:
  - `i18n.spec.ts`: German is the default even in an English browser, switching with the flag drop-down changes
    the UI but not the songs, an open song and the parent area are re-translated, the choice survives a reload.
  - `ui.spec.ts`: start screen, playing through a song, finish screen, controls, low/high bar labels, parent area
    press-and-hold, options persistence, loading an old eight-bar calibration.
  - `mic.spec.ts`: **real microphone detection** with Chromium's fake capture device fed by synthetic WAV recordings
    (`tests/e2e/fixtures.ts` generates them in `globalSetup`): correct strikes advance; low D does not count for the
    high d; high d does.
  - `pwa.spec.ts`: manifest and icons, service worker scope, offline reload.
  - `playback.spec.ts`: ▶ with Playwright's fake clock: every note of Bruder Jakob starts on time and the circle,
    track and highlighted bar follow; stop, circle tap and 🏠 end the playback.
  - `notation.spec.ts`: staff notation option, position left of the circle (laptops, tablets), no scrolling, hidden on phones,
    current/next note and octave (ledger lines) follow the song.
  - `instrument.spec.ts`: glockenspiel picture on tablet portrait (highlighted bar incl. D vs. d, colors/order,
    hidden on finish screen), playing by tapping bars or the circle (tones counted via an `AudioContext` spy),
    side-by-side layout on laptops and tablet landscape (no scrolling), hidden on phones. Saves screenshots to `test-results/`.
- `tests/e2e-preview/preview.spec.ts` (separate config `playwright.preview.config.ts`): builds the live site and a
  preview into `.site/` (`scripts/build-pages-site.sh`), serves it with `scripts/serve-static.mjs`, and checks that
  the preview opens as the preview even with the live worker installed, works offline, has its own manifest name and
  keeps its own settings.
- The synthetic recordings are an approximation (fundamental + ×2.76 overtone). Real-instrument behavior still needs
  the user to try it on the glockenspiel and report back.

## Microphone detection: design and gotchas

- Onset detection uses a **short window** (last 512 samples) and triggers on a **rise** versus the previous frame
  (`rms > prevRms*1.5`). A long window or a slow average made new strikes undetectable while the previous bar was still
  ringing. Do not revert to that.
- Pitch comes from an FFT of 4096 samples, taken 55 ms after the onset. Matching is **octave-specific** (needed
  because D/d, E/e, F/f, C/c share colors): the rounded MIDI number must equal the bar's `midi` within ±40 cents of
  equal temperament, or match the calibrated frequency (±50 cents). Calibrations saved with only eight bars still
  load; d e f fall back to nominal values.
- The app must not hear itself: `mic.block(ms)` mutes detection after any tone or speech the app produces (autoplay,
  the 🔊 button).
- A wrong note only gives a gentle wobble. No text, no sound. This is deliberate for a young child.

## UI decisions to preserve

- Large, icon-based, minimal start screen (song tiles only). Tapping a tile starts the song and turns the mic on.
- Controls are icon-only (🏠 🎤 🔊 ▶/⏹, and the speed of ▶: 🐌 slower, **1×**, which always reads 1× and resets the speed (highlighted while it is not 1×), 🏎 faster) plus a big yellow "🔁 Von vorn". ▶ plays the whole song in rhythm. The finish screen has a big "🔁 Nochmal!".
- **Every song tile needs a unique icon that is not used elsewhere in the UI** (enforced by a unit test). Current:
  🥜 Lasst uns froh und munter sein, ❄ Jingle Bells, 🎅 Morgen kommt der Weihnachtsmann, 🎄 Alle Jahre wieder,
  👶 Ihr Kinderlein, 🔔 Kling, Glöckchen, 😴 Bruder Jakob, 🎆 Freude, schöner Götterfunken. Avoid 🔊 🎤 🏠 🔁 ⚙ 🎵 ▶ ⏹
  🐌 🏎 and the praise sparkles ⭐ ✨ 🌟.
- Autoplay, read-aloud and staff notation are options in the parent area, all **off by default**.
- Playing without a real glockenspiel: tapping a bar of the on-screen glockenspiel plays its tone and is judged
  like a real strike (right bar → next note, wrong bar → wobble only). Tapping the big circle plays the current
  note and moves on. Every tone the app plays calls `mic.block()` so the microphone does not hear it. Bar taps are
  ignored during calibration.

## Adding songs (rules learned the hard way)

1. **Public domain only** (traditional, or authors dead 70+ years). Only the melody and the first verse. Avoid modern songs.
2. **The glockenspiel has only C D E F G A H c d e f** (c3–f4, no sharps or flats). The tune must fit some
   transposition onto these bars without accidentals: usually C major (C–f), or G major if the song never needs F♯
   (Bruder Jakob, Freude). If no transposition fits, it does not work.
3. **Do not guess melodies from memory and do not fold notes an octave.** A song that needs folding or substitutions
   "does not feel right" to the user (Sankt Martin and O Tannenbaum were rejected; both still don't fit the 11 bars).
   The user accepted one exception: Kling, Glöckchen plays F♯ as F.
   Kling, Glöckchen ends on E and Ihr Kinderlein has F on "Freu-de", as in lieder-archiv.de (fixed after the rhythm
   check found the app differed).
4. Verify notes against **exact data**, not just a scan: Wikibooks "Liederbuch" LilyPond source, German Wikipedia
   LilyPond (watch `note-language="deutsch"`: `b` = B♭, `h` = B), MusicXML/MIDI (e.g. lieder-archiv.de). Cross-check
   two sources when possible. Reading pitches from a scanned image is error-prone.
5. Take the **rhythm and tempo from exact data too** (MIDI/MusicXML/LilyPond). lieder-archiv.de has MIDI and
   MusicXML for most German songs (`/lieder/midi/<id>.mid`, `/lieder/xml/<id>.xml`); MIDI note-offs are shortened
   for articulation, so round to the notated lengths (check against the MusicXML when unsure).
6. Add the entry to `SONGS` with a unique icon, `bpm` and `rhythm`, add its exact sequence to
   `tests/unit/songs.test.ts`, run `npm run check`, and tell the user about any deviation from the original.

## Changelog highlights

Calibration via microphone with a parent settings dialog; kid-friendly UI (icons, big restart, next-note preview,
sparkles); PWA; faster onset detection; MIT-0 license; 11 bars with octave-specific detection; TypeScript + Vite
build with unit and e2e tests and a CI deploy.
