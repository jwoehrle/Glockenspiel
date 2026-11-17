# Mein Glockenspiel

A small web app for learning songs on a glockenspiel (C–c, eight bars).
It shows the next color/note and listens through the microphone to check whether the right bar was struck.

- Live: https://jwoehrle.github.io/Glockenspiel/
- A single page (`index.html`), no build step, no dependencies.
- Installable as an app (PWA) and usable offline.

## Testing locally

Requirement: Python 3 (available on most systems).

```bash
cd glockenspiel
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open in your browser (Chrome recommended): <http://localhost:8000>

Stop with `Ctrl+C`.

Notes:

- **Microphone:** only works in a secure context. `localhost` counts as one; double-clicking `index.html` (`file://`) is unreliable. The browser asks for microphone permission the first time you tap a song.
- **Seeing changes:** reload normally (Ctrl+R). The service worker fetches the newest version from the network first. If something sticks, use Ctrl+Shift+R, or in DevTools under *Application → Service Workers* enable "Update on reload" or click "Unregister".
- **Settings are separate per address:** `localhost:8000` and the live site each have their own calibration and options (stored in `localStorage`).

### Testing on a phone

`http://<laptop-ip>:8000` has no microphone on the phone (no HTTPS). Use Chrome port forwarding instead:

1. Connect the phone via USB and enable USB debugging on it.
2. On the laptop, open `chrome://inspect/#devices`.
3. Under *Port forwarding*, add `8000` → `localhost:8000` and enable it.
4. On the phone, open `http://localhost:8000` in Chrome.

## Usage

- **Tap a song tile:** starts the song and turns the microphone on.
- **🎤** microphone on/off · **🔔** play the current note · **🔁 Von vorn** restart the song · **🏠** back to the song list.
- Tap the big circle to move to the next note without the microphone.
- **Parent area:** press and hold the ⚙️ in the top-right corner for about 1 second. It contains: autoplay, read the color aloud, microphone sensitivity, one note back, calibration, and clearing saved data.

### Calibration (optional)

In the parent area, tap *Kalibrieren* and strike the eight bars one at a time. The app stores the measured frequencies and then checks against those (±50 cents) instead of standard tuning. For a normally tuned glockenspiel this isn't needed.

## Adding songs

Add an entry to the `SONGS` object in `index.html`:

```js
meinlied: {icon:"🎵", title:"Title", notes: build([
  "Line-|C one|D here|E",
  "Line-|F two|G now|AB"   // two letters = two notes on one syllable
])}
```

Format: `syllable|note`, where notes are `C D E F G A H c` (`c` = high C). Use `_` for a space inside a syllable. Only use notes within the C–c range; lower or higher notes have to be transposed or moved by an octave.

## PWA / updates

Files: `manifest.webmanifest`, `sw.js`, `icons/`.

After changing `index.html`, the icons or the manifest, bump the version in `sw.js` (`const VERSION = "glock-v2"` → `glock-v3`) so installed apps discard the old cache.

## Publishing

The site is served by GitHub Pages from the `main` branch (folder `/`). A `git push` to `main` is enough; the update is live after a minute or two.
