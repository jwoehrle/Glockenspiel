import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SR = 48000;

/**
 * A synthetic glockenspiel recording: silence, then one strike per frequency. Each strike has the bar's
 * fundamental plus the typical inharmonic bar overtone (×2.76), with an exponential decay.
 */
export function strikes(freqs: number[], { lead = 1.5, gap = 0.9, decay = 0.35 } = {}): Int16Array {
  const total = Math.ceil((lead + freqs.length * gap + 1) * SR);
  const out = new Float32Array(total);
  freqs.forEach((f, k) => {
    const start = Math.round((lead + k * gap) * SR);
    for (let i = 0; start + i < total && i < gap * SR; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.002) * Math.exp(-t / decay);
      out[start + i] =
        (out[start + i] ?? 0) +
        env * (0.5 * Math.sin(2 * Math.PI * f * t) + 0.12 * Math.sin(2 * Math.PI * f * 2.76 * t));
    }
  });
  return Int16Array.from(out, (v) => Math.max(-32767, Math.min(32767, Math.round(v * 32767))));
}

/** Write 16-bit mono PCM WAV. */
export function writeWav(path: string, pcm: Int16Array): void {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.byteLength, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.byteLength, 40);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.concat([h, Buffer.from(pcm.buffer)]));
}
