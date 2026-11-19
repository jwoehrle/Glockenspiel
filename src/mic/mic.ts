import { audio } from "../audio/bell";
import { OnsetDetector } from "./onset";
import { peakFreqs, rms } from "./pitch";

export interface MicCallbacks {
  /** Spectral peaks of a detected strike, strongest first. */
  onStrike(freqs: number[]): void;
  /** Input level 0–1 for the meter. */
  onLevel(level: number): void;
  /** Current sensitivity 1–10. */
  sensitivity(): number;
}

export const canMic = (): boolean => !!navigator.mediaDevices?.getUserMedia;

/** Microphone input with onset detection and FFT pitch analysis. */
export class Mic {
  listening = false;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private buf: Float32Array<ArrayBuffer> | null = null;
  private spec: Float32Array<ArrayBuffer> | null = null;
  readonly onset = new OnsetDetector();

  constructor(private readonly cb: MicCallbacks) {}

  async start(): Promise<void> {
    const a = audio();
    // Raw signal: the browser's voice processing would suppress the bar's sound.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const src = a.createMediaStreamSource(this.stream);
    this.analyser = a.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0;
    src.connect(this.analyser);
    this.listening = true;
    this.loop();
  }

  stop(): void {
    this.listening = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  /** Mute detection for `ms` (after the app plays a tone or speaks). */
  block(ms: number): void {
    this.onset.block(performance.now(), ms);
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const an = this.analyser;
    if (!an) return;
    if (this.buf?.length !== an.fftSize) this.buf = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(this.buf);
    const level = rms(this.buf, OnsetDetector.WINDOW);
    this.cb.onLevel(level);
    if (this.onset.step(level, performance.now(), this.cb.sensitivity())) {
      if (this.spec?.length !== an.frequencyBinCount) this.spec = new Float32Array(an.frequencyBinCount);
      an.getFloatFrequencyData(this.spec);
      const fs = peakFreqs(this.spec, audio().sampleRate / an.fftSize);
      if (fs.length) this.cb.onStrike(fs);
    }
  };
}
