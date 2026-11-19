---
inclusion: always
---

# Structure

- `index.html`: markup only (Vite entry, loads `src/main.ts`).
- `src/notes.ts`: bars, colors, MIDI numbers, frequencies, labels.
- `src/songs.ts`: song data and `build()`. Token format `syllable|notes`; lowercase `c d e f` are the high bars.
- `src/app.ts`: state and UI flow (modes, track, next/miss, playback, calibration, parent area).
- `src/mic/`: `pitch.ts`, `detect.ts`, `onset.ts` (pure logic) and `mic.ts` (getUserMedia loop).
- `src/audio/`: `bell.ts` (tone), `player.ts` (song playback), `speed.ts` (tempo steps).
- `src/ui/`: `dom.ts`, `instrument.ts`, `staff.ts`, `sparkle.ts`. Styles in `src/style.css`.
- `src/storage.ts`: `localStorage` access, never throws.
- `src/sw.ts`: service worker. `public/icons/`: app icons.
- `tests/unit/`: Vitest. `tests/e2e/`: Playwright against the production build. `tests/e2e-preview/`: preview layout.
- `scripts/`: build and serve helpers for the preview site.

## Conventions

- Keep pure logic (pitch, detection, scheduling, speed) free of DOM access so it stays unit-testable.
- New behavior gets a unit test; UI flows get a Playwright test.
- Microphone: the app must not hear itself. Call `mic.block(ms)` after any tone or speech it produces.
- Onset detection uses a short window and a rise versus the previous frame. Do not revert to a long window.
- Note matching is octave-specific (D/d, E/e, F/f, C/c share colors).
- Full design notes and gotchas: `AGENTS.md`.
