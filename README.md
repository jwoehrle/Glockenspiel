# Mein Glockenspiel

Kleine Web-App zum Lernen von Liedern auf einem Glockenspiel (C–c, acht Klangstäbe).
Die App zeigt die nächste Farbe/den nächsten Ton und hört per Mikrofon zu, ob der richtige Stab angeschlagen wurde.

- Live: https://jwoehrle.github.io/Glockenspiel/
- Eine einzige Seite (`index.html`), kein Build-Schritt, keine Abhängigkeiten.
- Als App installierbar (PWA) und offline nutzbar.

## Lokal testen

Voraussetzung: Python 3 (auf den meisten Systemen vorhanden).

```bash
cd glockenspiel
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann im Browser (Chrome empfohlen) öffnen: <http://localhost:8000>

Beenden mit `Strg+C`.

Hinweise:

- **Mikrofon:** funktioniert nur in einem sicheren Kontext. `localhost` zählt dazu, ein Doppelklick auf `index.html` (`file://`) nicht zuverlässig. Beim ersten Antippen eines Lieds fragt der Browser nach der Mikrofon-Erlaubnis.
- **Änderungen sehen:** normal neu laden (Strg+R). Der Service Worker lädt zuerst die neueste Version aus dem Netz. Wenn doch etwas hängt: Strg+Shift+R, oder in den DevTools unter *Application → Service Workers* „Update on reload“ aktivieren bzw. „Unregister“ klicken.
- **Einstellungen sind pro Adresse getrennt:** `localhost:8000` und die Live-Seite haben jeweils eigene Kalibrierung und Optionen (gespeichert im `localStorage`).

### Auf dem Handy testen

`http://<laptop-ip>:8000` hat auf dem Handy kein Mikrofon (kein HTTPS). Stattdessen per Chrome-Portweiterleitung:

1. Handy per USB anschließen, auf dem Handy USB-Debugging aktivieren.
2. Auf dem Laptop `chrome://inspect/#devices` öffnen.
3. Bei *Port forwarding* `8000` → `localhost:8000` eintragen und aktivieren.
4. Auf dem Handy in Chrome `http://localhost:8000` öffnen.

## Bedienung

- **Liedkachel antippen:** startet das Lied und schaltet das Mikrofon ein.
- **🎤** Mikrofon an/aus · **🔔** aktuellen Ton vorspielen · **🔁 Von vorn** Lied neu starten · **🏠** zurück zur Liedauswahl.
- Großen Kreis antippen = ohne Mikrofon zum nächsten Ton.
- **Eltern-Bereich:** das ⚙️ oben rechts ca. 1 Sekunde gedrückt halten. Dort: automatisches Vorspielen, Farbe vorlesen, Mikrofon-Empfindlichkeit, einen Ton zurück, Kalibrierung, gespeicherte Daten löschen.

### Kalibrierung (optional)

Im Eltern-Bereich auf *Kalibrieren* tippen und nacheinander die acht Stäbe einzeln anschlagen. Die App merkt sich die gemessenen Frequenzen und prüft danach gegen diese (±50 Cent) statt gegen die Standardstimmung. Bei einem normal gestimmten Glockenspiel ist das nicht nötig.

## Lieder hinzufügen

In `index.html` im Objekt `SONGS` einen Eintrag ergänzen:

```js
meinlied: {icon:"🎵", title:"Titel", notes: build([
  "Zei-|C le|D eins|E",
  "Zei-|F le|G zwei|AB"   // zwei Buchstaben = zwei Töne auf einer Silbe
])}
```

Format: `Silbe|Ton`, Töne sind `C D E F G A H c` (`c` = hohes C). Leerzeichen in Silben als `_`. Nur Töne aus dem Bereich C–c verwenden; tiefere/höhere Töne müssen transponiert oder eine Oktave verlegt werden.

## PWA / Updates

Dateien: `manifest.webmanifest`, `sw.js`, `icons/`.

Nach Änderungen an `index.html`, den Icons oder dem Manifest die Version in `sw.js` erhöhen (`const VERSION = "glock-v2"` → `glock-v3`), damit installierte Apps den alten Cache verwerfen.

## Veröffentlichen

Die Seite wird über GitHub Pages aus dem Branch `main` (Ordner `/`) ausgeliefert. Ein `git push` auf `main` genügt; das Update ist nach ein bis zwei Minuten online.
