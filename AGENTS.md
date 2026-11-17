# AGENTS.md

Guidance for AI agents continuing development in a fresh session. Read this first, then `README.md`.

## What this is

"Mein Glockenspiel": a single-page web app (German UI) that teaches a young child (about 6 years old) songs on a
diatonic glockenspiel with eight color-coded bars (C D E F G A H c). It shows the next note as a colored circle and
listens through the microphone to check that the right bar was struck. Hosted on GitHub Pages, installable as a PWA.

- Live: https://jwoehrle.github.io/Glockenspiel/ (served from `main`, folder `/`; a push to `main` publishes it)
- No build step, no dependencies, no framework. Everything is in `index.html` (HTML + CSS + JS).
- Other files: `sw.js` (service worker), `manifest.webmanifest`, `icons/`, `README.md`, `LICENSE.md` (MIT-0).

## Working rules

- **Do not commit or push unless the user asks.** They request it explicitly each time.
- **Never rewrite git history or force-push without an explicit request.** (It was done once, deliberately, to remove a personal name.)
- **Privacy:** the app and repo must not contain the child's name or other personal details. Keep text generic ("Mein Glockenspiel", "Super gemacht!").
- **After changing `index.html`, icons or the manifest, bump `VERSION` in `sw.js`** (`glock-vN` → `glock-vN+1`) so installed PWAs drop the old cache. The worker is network-first, so this is a safety net.
- UI text is **German**; code comments mix German/English; `README.md` and this file are English.
- The user writes in English or German; answer in the language they used.

## Test locally

```bash
python3 -m http.server 8000 --bind 127.0.0.1   # then open http://localhost:8000
```

`localhost` counts as a secure context, so the microphone works. `file://` is unreliable. Stop the server when done.

You cannot test microphone detection yourself; ask the user to try it on the real glockenspiel and report back.

Quick checks without a browser (script syntax, song data):

```bash
node -e "const s=require('fs').readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const head=s.slice(0,s.indexOf('let songKey'));
const {SONGS,COL}=new Function(head+';return {SONGS,COL}')();
for(const k in SONGS){const m=SONGS[k].notes;console.log(k,m.length,m.every(x=>x.n in COL)?'ok':'BAD')}; new Function(s)"
```

## Code map (`index.html`)

- `COL` / `FREQ`: bar colors, names, pitch classes, nominal frequencies. `ORDER` = the eight notes.
- `SONGS` + `build(lines)`: song data. Token format `syllable|notes`, e.g. `Mar-|C tin|DE`. Two letters = two notes on one syllable; `_` is a space inside a syllable.
- `setMode("home"|"play")`: `body.home` shows only the song tiles; `body.play` shows the stage (big circle, next-note preview, track, controls).
- `show()`, `next()`, `miss()`, `sparkle()`, `announce()`: UI flow. `announce()` optionally reads the color aloud and plays the note.
- Microphone: `startMic()`, `stopMic()`, `loop()` (onset detection), `peakFreqs()`, `detect()` (matching).
- Calibration: `calHit()`, `calAdvance()`, `endCal()`; stored in `localStorage` (`glock-cal`). Options in `glock-opts`.
- Parent area: `<dialog id="settings">`, opened by **press-and-hold (~0.8 s)** on the faint ⚙️ top-right, so the child can't open it by accident.

## Microphone detection: design and gotchas

- Onset detection uses a **short window** (last 512 samples) and triggers on a **rise** versus the previous frame (`rms > prevRms*1.5`). A long window or a slow average made new strikes undetectable while the previous bar was still ringing. Do not revert to that.
- Pitch comes from an FFT of 4096 samples, taken 55 ms after the onset. Matching is by pitch class (octave-agnostic) within ±40 cents of equal temperament, or against calibrated frequencies (±50 cents).
- The app must not hear itself: `blockDetect(ms)` mutes detection after any tone or speech the app produces (autoplay, the 🔊 button).
- A wrong note only gives a gentle wobble. No text, no sound. This is deliberate for a young child.

## UI decisions to preserve

- Large, icon-based, minimal start screen (song tiles only). Tapping a tile starts the song and turns the mic on.
- Controls are icon-only (🏠 🎤 🔊) plus a big yellow "🔁 Von vorn". The finish screen has a big "🔁 Nochmal!".
- **Every song tile needs a unique icon that is not used elsewhere in the UI.** Current: 🥜 Lasst uns froh und munter sein, ❄️ Jingle Bells, 🎅 Morgen kommt der Weihnachtsmann, 🎄 Alle Jahre wieder, 👶 Ihr Kinderlein, 🔔 Kling, Glöckchen. Avoid 🔊 🎤 🏠 🔁 ⚙️ and the praise sparkles ⭐ ✨ 🌟.
- Autoplay and read-aloud are options in the parent area, both **off by default**.

## Adding songs (rules learned the hard way)

1. **Public domain only** (traditional, or authors dead 70+ years). Only the melody and the first verse. Avoid modern songs.
2. **The glockenspiel has only C D E F G A H c** (one octave, no sharps or flats). Transpose to C major. If the tune needs notes outside C–c or accidentals, it generally does not work.
3. **Do not guess melodies from memory and do not fold notes an octave.** A song that needs folding or substitutions "does not feel right" to the user (Sankt Martin and O Tannenbaum were rejected for this). The user accepted one exception: Kling, Glöckchen plays F♯ as F.
4. Verify notes against **exact data**, not just a scan: Wikibooks "Liederbuch" LilyPond source, German Wikipedia LilyPond, or a MIDI (parse note numbers). Cross-check against a sheet when possible. Reading pitches from a scanned image is error-prone (an earlier read was off by a step).
5. Add the entry to `SONGS`, give it a unique icon, run the check script above, bump `sw.js`, and tell the user about any deviation from the original.

## Changelog highlights

Calibration via microphone with a parent settings dialog; kid-friendly UI (icons, big restart, next-note preview, sparkles); PWA (manifest, icons, offline service worker); faster onset detection; MIT-0 license.
