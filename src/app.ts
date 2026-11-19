import { bell } from "./audio/bell";
import { SongPlayer } from "./audio/player";
import { calibrationPeak, judge, type Calibration } from "./mic/detect";
import { Mic, canMic } from "./mic/mic";
import { COL, FREQ, ORDER, highTwin, isHigh, label, type NoteName } from "./notes";
import { SONGS, SONG_KEYS, type SongKey } from "./songs";
import { OPT_DEFAULTS, clearAll, loadCal, loadOpts, saveCal, saveOpts } from "./storage";
import { $, button, input } from "./ui/dom";
import { highlightBar, renderInstrument, strikeBar } from "./ui/instrument";
import { renderStaff } from "./ui/staff";
import { sparkle } from "./ui/sparkle";

type Mode = "home" | "play";

const STAR = '<span class="star">★</span>';

// ---------- state ----------
let songKey: SongKey = SONG_KEYS[0] ?? "froh";
let idx = 0;
let mode: Mode = "home";
let cal: Calibration | null = loadCal();
let calIdx = -1;
let calTmp: Partial<Calibration> = {};
let opts = loadOpts();
let announceT = 0;
let annId = 0;
let micFailed = false;

const song = () => SONGS[songKey];

const mic = new Mic({
  onStrike: (fs) => strike(fs),
  onLevel: (l) => {
    $("lvl").style.width = Math.min(100, l * 600) + "%";
  },
  sensitivity: () => +input("sens").value,
});

const barFreq = (n: NoteName): number => (cal ? cal[n] : FREQ[n]);

// ---------- playing the whole song ----------
const player = new SongPlayer();

function setPlayingUI(on: boolean): void {
  const b = button("playsong");
  b.textContent = on ? "⏹" : "▶";
  b.title = b.ariaLabel = on ? "Vorspielen stoppen" : "Ganzes Lied vorspielen";
  b.classList.toggle("playing", on);
}

/** Play the whole song from the start; circle, track and glockenspiel follow every note. */
function playSong(): void {
  if (calIdx >= 0) return;
  ++annId;
  clearTimeout(announceT);
  cancelSpeech();
  const notes = song().notes;
  setPlayingUI(true);
  player.play(notes, song().bpm, {
    onNote: (i) => {
      const x = notes[i];
      if (!x) return;
      idx = i;
      show();
      restartAnim($("big"), "hit");
      playTone(x.n);
    },
    onEnd: () => {
      setPlayingUI(false);
      // Back to the first note, ready to play along.
      idx = 0;
      show();
      announce();
    },
  });
}

/** Stop the playback (any other interaction does this first). Returns true if it was playing. */
function stopSong(): boolean {
  if (!player.playing) return false;
  player.stop();
  setPlayingUI(false);
  idx = 0;
  show();
  return true;
}

function setMode(m: Mode): void {
  mode = m;
  document.body.className = m + (opts.staff ? " notation" : "");
  $("title").textContent = m === "home" ? "🎵 Mein Glockenspiel" : `${song().icon} ${song().title}`;
}

function renderSongs(): void {
  const box = $("songs");
  box.innerHTML = "";
  for (const k of SONG_KEYS) {
    const s = SONGS[k];
    const b = document.createElement("button");
    b.innerHTML = `<span class="ic">${s.icon}</span><span class="tt">${s.title}</span>`;
    b.title = s.title;
    b.dataset.song = k;
    b.onclick = () => {
      songKey = k;
      idx = 0;
      setMode("play");
      renderTrack();
      show();
      // Tapping a tile is the user gesture that also turns the microphone on.
      if (canMic() && !micFailed && !mic.listening) void startMic().then(() => announce());
      else announce();
    };
    box.appendChild(b);
  }
}

function renderTrack(): void {
  const t = $("track");
  t.innerHTML = "";
  const notes = song().notes;
  notes.forEach((x, i) => {
    const d = document.createElement("div");
    d.className = "dot";
    if (i > 0 && x.line !== notes[i - 1]?.line) d.style.marginLeft = "14px";
    d.innerHTML = `<div class="c" style="background:${COL[x.n].hex}">${label(x.n) + (isHigh(x.n) ? "*" : "")}</div><div class="t">${x.s}</div>`;
    d.onclick = () => {
      stopSong();
      idx = i;
      show();
      announce();
    };
    t.appendChild(d);
  });
}

function showBar(n: NoteName): void {
  $("big").style.background = COL[n].hex;
  $("big").innerHTML = label(n) + (isHigh(n) ? STAR : "");
  $("big").dataset.note = n;
}

function show(): void {
  const dots = [...$("track").children] as HTMLElement[];
  if (calIdx >= 0) {
    const n = ORDER[calIdx] as NoteName;
    $("done").style.display = "none";
    $("big").style.display = "flex";
    $("colname").style.display = "block";
    $("syl").style.display = "block";
    showBar(n);
    highlightBar($("instrument"), n);
    renderStaff($("staff"), n, null);
    $("colname").textContent = COL[n].name + (highTwin(n) ? " links" : "");
    $("syl").textContent = `Kalibrieren ${calIdx + 1}/${ORDER.length}`;
    $("hint").textContent = "Schlag diesen Stab einzeln an (Kreis antippen = überspringen)";
    dots.forEach((d) => (d.className = "dot done"));
    $("next").innerHTML = "";
    return;
  }
  const notes = song().notes;
  const x = notes[idx];
  $("done").style.display = x ? "none" : "flex";
  $("big").style.display = x ? "flex" : "none";
  $("colname").style.display = x ? "block" : "none";
  $("syl").style.display = x ? "block" : "none";
  dots.forEach((d, i) => (d.className = "dot" + (i < idx ? " done" : "") + (i === idx ? " cur" : "")));
  highlightBar($("instrument"), x ? x.n : null);
  renderStaff($("staff"), x ? x.n : null, notes[idx + 1]?.n ?? null);
  if (!x) {
    $("hint").textContent = "";
    $("next").innerHTML = "";
    return;
  }
  showBar(x.n);
  // Same color exists left and right: say "links" if the song also needs the high bar.
  const twin = highTwin(x.n);
  $("colname").textContent = COL[x.n].name + (twin && notes.some((y) => y.n === twin) ? " links" : "");
  $("syl").textContent = x.s;
  const nx = notes[idx + 1];
  $("next").innerHTML = nx
    ? `<span>danach</span><span class="nd" style="background:${COL[nx.n].hex}">${label(nx.n)}</span>`
    : "";
  const cur = dots[idx];
  if (cur) {
    const t = $("track");
    t.scrollLeft = cur.offsetLeft - t.clientWidth / 2 + 17;
  }
}

function restartAnim(el: HTMLElement, cls: string): void {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function next(): void {
  restartAnim($("big"), "hit");
  sparkle($("sparks"));
  idx++;
  show();
  announce();
}

// Wrong note: only a gentle wobble. No text, no sound (deliberate for a young child).
function miss(): void {
  restartAnim($("big"), "miss");
}

function cancelSpeech(): void {
  try {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Announce the new note: optionally read the color aloud, optionally play the tone. */
function announce(): void {
  const my = ++annId;
  clearTimeout(announceT);
  cancelSpeech();
  if (mode !== "play" || calIdx >= 0 || (!opts.auto && !opts.speak)) return;
  const x = song().notes[idx];
  if (!x) return;
  mic.block(opts.speak ? 2500 : 1500);
  const ring = () => {
    if (my === annId && opts.auto && mode === "play" && calIdx < 0) {
      mic.block(1500);
      bell(barFreq(x.n));
    }
  };
  if (opts.speak && "speechSynthesis" in window) {
    let fired = false;
    const go = () => {
      if (fired || my !== annId) return;
      fired = true;
      clearTimeout(announceT);
      ring();
    };
    const u = new SpeechSynthesisUtterance($("colname").textContent ?? "");
    u.lang = "de-DE";
    u.rate = 0.9;
    u.onend = go;
    u.onerror = go;
    announceT = window.setTimeout(go, 1800);
    try {
      speechSynthesis.speak(u);
    } catch {
      go();
    }
  } else announceT = window.setTimeout(ring, 300);
}

/** Play a bar's tone; the microphone must not hear it as a strike. */
function playTone(n: NoteName): void {
  mic.block(1500);
  bell(barFreq(n));
}

/** A bar of the on-screen glockenspiel was tapped: same rules as a real strike. */
function tapBar(n: NoteName): void {
  if (mode !== "play" || calIdx >= 0) return;
  stopSong();
  const x = song().notes[idx];
  if (!x) return;
  playTone(n);
  strikeBar($("instrument"), n);
  if (x.n === n) next();
  else miss();
}

// ---------- microphone ----------
async function startMic(): Promise<boolean> {
  try {
    await mic.start();
    button("mic").className = "listening";
    $("meter").style.display = "block";
    $("hint").textContent = "Ich höre zu – spiel den Ton!";
    return true;
  } catch {
    micFailed = true;
    button("mic").style.display = "none";
    $("foot").style.display = "block";
    $("foot").innerHTML =
      "Das Mikrofon ist hier nicht erlaubt. Öffne die Seite im Browser (z.&nbsp;B. Chrome), dann hört die App zu. Bis dahin: großen Kreis antippen.";
    return false;
  }
}

function stopMic(): void {
  if (calIdx >= 0) endCal(false);
  mic.stop();
  button("mic").className = "primary";
  $("meter").style.display = "none";
  $("hint").textContent = "";
}

function strike(fs: number[]): void {
  if (player.playing) return;
  if (calIdx >= 0) {
    calHit(fs);
    return;
  }
  const x = song().notes[idx];
  if (!x) return;
  const v = judge(fs, x.n, cal);
  if (v.kind === "hit") next();
  else if (v.kind === "miss") miss();
}

// ---------- calibration ----------
function updateCalUI(): void {
  button("cal").textContent =
    calIdx >= 0 ? "✖ Kalibrierung abbrechen" : cal ? "🎯 Neu kalibrieren" : "🎯 Kalibrieren";
  button("cal").className = calIdx >= 0 ? "calon" : "";
  button("calreset").disabled = !cal;
  $("calcancel").style.display = calIdx >= 0 ? "block" : "none";
  $("calState").textContent = cal ? "Kalibrierung gespeichert." : "Keine Kalibrierung gespeichert.";
}

function calHit(fs: number[]): void {
  const n = ORDER[calIdx] as NoteName;
  const f = calibrationPeak(fs, n);
  if (f === undefined) {
    $("hint").textContent = "Nicht erkannt – nochmal anschlagen";
    return;
  }
  calTmp[n] = f;
  $("hint").textContent = `${Math.round(f)} Hz ✓`;
  setTimeout(calAdvance, 350);
}

function calAdvance(): void {
  if (calIdx < 0) return;
  calIdx++;
  if (calIdx >= ORDER.length) endCal(true);
  else show();
}

function endCal(ok: boolean): void {
  calIdx = -1;
  if (ok) {
    // Skipped bars keep their previous (or nominal) value.
    const base = cal ?? FREQ;
    cal = Object.fromEntries(ORDER.map((n) => [n, calTmp[n] ?? base[n]])) as Calibration;
    saveCal(cal);
  }
  updateCalUI();
  show();
  $("hint").textContent = ok ? "Kalibriert ✓ – die App erkennt jetzt dein Glockenspiel." : "";
}

// ---------- parent area ----------
function openSettings(): void {
  $("setMsg").textContent = "";
  input("optAuto").checked = opts.auto;
  input("optSpeak").checked = opts.speak;
  input("optStaff").checked = opts.staff;
  updateCalUI();
  $<HTMLDialogElement>("settings").showModal();
}

function wire(): void {
  const settings = $<HTMLDialogElement>("settings");

  // Tapping the circle plays the current note and moves on (playing without a real glockenspiel).
  $("big").onclick = () => {
    if (stopSong()) return;
    if (calIdx >= 0) {
      calAdvance();
      return;
    }
    const x = song().notes[idx];
    if (x) playTone(x.n);
    next();
  };
  button("playsong").onclick = () => {
    if (!stopSong()) playSong();
  };
  button("play").onclick = () => {
    stopSong();
    const x = song().notes[idx];
    if (x) {
      mic.block(1800);
      bell(barFreq(x.n));
    }
  };
  button("back").onclick = () => {
    stopSong();
    settings.close();
    idx = Math.max(0, idx - 1);
    show();
    announce();
  };
  button("restart").onclick = button("again").onclick = () => {
    stopSong();
    idx = 0;
    show();
    announce();
  };
  button("home").onclick = () => {
    stopSong();
    ++annId;
    clearTimeout(announceT);
    cancelSpeech();
    if (mic.listening) stopMic();
    setMode("home");
  };

  if (!canMic()) {
    button("mic").style.display = "none";
    button("cal").style.display = "none";
  }
  button("mic").onclick = () => (mic.listening ? stopMic() : void startMic());

  button("cal").onclick = async () => {
    stopSong();
    settings.close();
    if (calIdx >= 0) {
      endCal(false);
      return;
    }
    if (mode !== "play") {
      setMode("play");
      renderTrack();
    }
    if (!mic.listening && !(await startMic())) return;
    calIdx = 0;
    calTmp = {};
    updateCalUI();
    show();
  };
  button("calcancel").onclick = () => endCal(false);

  // Parent area: press and hold the gear for ~0.8 s, so the child can't open it by accident (keyboard: Enter).
  const gear = button("settingsBtn");
  const gearHint = $("gearhint");
  let gearT = 0;
  let gearHintT = 0;
  let opened = false;
  gear.addEventListener("pointerdown", () => {
    opened = false;
    gearHint.hidden = true;
    gear.classList.add("hold");
    clearTimeout(gearT);
    gearT = window.setTimeout(() => {
      gear.classList.remove("hold");
      opened = true;
      openSettings();
    }, 800);
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) {
    gear.addEventListener(ev, () => {
      clearTimeout(gearT);
      gear.classList.remove("hold");
    });
  }
  gear.addEventListener("click", (e) => {
    if (e.detail === 0) {
      openSettings(); // keyboard
    } else if (!opened) {
      // A short tap does nothing on purpose; say how to open the parent area instead of staying silent.
      gearHint.hidden = false;
      clearTimeout(gearHintT);
      gearHintT = window.setTimeout(() => (gearHint.hidden = true), 3000);
    }
  });
  gear.addEventListener("contextmenu", (e) => e.preventDefault());

  button("setClose").onclick = () => settings.close();
  settings.addEventListener("click", (e) => {
    if (e.target === settings) settings.close();
  });
  input("optAuto").onchange = () => {
    opts.auto = input("optAuto").checked;
    saveOpts(opts);
  };
  input("optSpeak").onchange = () => {
    opts.speak = input("optSpeak").checked;
    saveOpts(opts);
  };
  input("optStaff").onchange = () => {
    opts.staff = input("optStaff").checked;
    saveOpts(opts);
    document.body.classList.toggle("notation", opts.staff);
  };
  button("calreset").onclick = () => {
    cal = null;
    saveCal(cal);
    updateCalUI();
    $("setMsg").textContent = "Kalibrierung gelöscht.";
  };
  button("clearall").onclick = () => {
    clearAll();
    cal = null;
    opts = { ...OPT_DEFAULTS };
    input("optAuto").checked = opts.auto;
    input("optSpeak").checked = opts.speak;
    input("optStaff").checked = opts.staff;
    document.body.classList.toggle("notation", opts.staff);
    updateCalUI();
    $("setMsg").textContent = "Alle gespeicherten Daten gelöscht.";
  };
}

export function init(): void {
  wire();
  renderInstrument($("instrument"), tapBar);
  updateCalUI();
  setMode("home");
  renderSongs();
  renderTrack();
  show();
}
