---
inclusion: always
---

# Product

"Mein Glockenspiel" is a single-page web app that teaches a young child (about 6) songs on a diatonic glockenspiel
(Sonor GS Toysound, 11 color-coded bars: C D E F G A H c d e f). It shows the next note as a colored circle and
listens through the microphone to check that the right bar was struck. Hosted on GitHub Pages, installable as a PWA.

## Principles

- Two UI languages, English and German, chosen with the flag drop-down next to the ⚙. The default is German (the child's
  language), whatever the browser language is. Songs keep their own language.
- Large, icon-based, minimal UI. The child must be able to use it alone.
- A wrong note only gives a gentle wobble. No text, no error sound.
- Parent options (autoplay, read-aloud, staff notation) are off by default and live in the press-and-hold settings dialog.
- Privacy: never put the child's name or other personal details in the app or repo. Keep text generic.
- Every song tile needs a unique icon that is used nowhere else in the UI (enforced by a unit test).

## Songs

- Public domain only, melody and first verse only.
- Must fit the 11 bars without accidentals. Do not guess melodies, do not fold notes by an octave.
- Verify notes, rhythm and tempo against exact data (LilyPond, MusicXML, MIDI). Cross-check two sources.
- Details: see `AGENTS.md`, section "Adding songs".
