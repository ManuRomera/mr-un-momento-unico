import { get } from "../settings.mjs";

/**
 * Sonido sin archivos: ambientes, efectos y un koto muy esporádico sintetizados con Web Audio.
 * Tres volúmenes independientes por usuario: ambiente, efectos y música.
 */
export const AMBIENTS = ["snow", "wind", "rain", "cicadas", "temple", "silence"];
/** Escala In (pentatónica japonesa) sobre Re: Re, Mi♭, Sol, La, Si♭. */
const IN_SCALE = [293.66, 311.13, 392.0, 440.0, 466.16, 587.33];

export class SoundService {
  static #ctx; static #sfx; static #amb; static #mus; static #noise = {};
  static #current = { key: "", nodes: [], timers: [], gain: null };

  static get enabled() { return Boolean(get("soundFx")); }

  static #context() {
    if (!this.#ctx) {
      const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Ctx) return null;
      this.#ctx = new Ctx();
      const bus = () => { const g = this.#ctx.createGain(); g.connect(this.#ctx.destination); return g; };
      this.#sfx = bus(); this.#amb = bus(); this.#mus = bus();
      this.volumes();
    }
    if (this.#ctx.state === "suspended") this.#ctx.resume().catch(() => {});
    return this.#ctx;
  }

  /** Los navegadores solo permiten audio tras un gesto: se reanuda al primer clic. */
  static init() {
    document.addEventListener("pointerdown", () => { if (this.#ctx?.state === "suspended") this.#ctx.resume(); }, { passive: true });
    Hooks.on("mrUmuPreferences", () => this.refresh());
  }

  static volumes() {
    if (!this.#ctx) return;
    const t = this.#ctx.currentTime, on = this.enabled;
    this.#sfx.gain.setTargetAtTime(on ? Number(get("sfxVolume")) : 0, t, 0.05);
    this.#amb.gain.setTargetAtTime(on ? Number(get("ambientVolume")) : 0, t, 0.4);
    this.#mus.gain.setTargetAtTime(on && get("music") ? Number(get("musicVolume")) : 0, t, 0.1);
  }

  static #noiseBuffer(color = "white") {
    const ctx = this.#ctx;
    if (this.#noise[color]) return this.#noise[color];
    const length = ctx.sampleRate * 3, buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === "brown") { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
      else if (color === "pink") { last = 0.97 * last + 0.03 * white; data[i] = (last * 6 + white * 0.25) * 0.5; }
      else data[i] = white;
    }
    return this.#noise[color] = buffer;
  }
  static #source(color, dest) { const s = this.#ctx.createBufferSource(); s.buffer = this.#noiseBuffer(color); s.loop = true; s.connect(dest); s.start(); return s; }
  static #filter(type, frequency, Q = 0.7) { const f = this.#ctx.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = Q; return f; }
  static #gain(value) { const g = this.#ctx.createGain(); g.gain.value = value; return g; }
  static #lfo(param, rate, depth) { const o = this.#ctx.createOscillator(), g = this.#gain(depth); o.frequency.value = rate; o.connect(g).connect(param); o.start(); return [o, g]; }
  static #chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes; }

  /* ---------- ambientes ---------- */

  static #build(key, out) {
    const nodes = [], timers = [], ctx = this.#ctx;
    const noise = (color, ...chain) => { this.#chain(...chain, out); nodes.push(this.#source(color, chain[0]), ...chain); return chain.at(-1); };
    const every = (min, max, fn) => { const tick = () => { fn(); timers.push(setTimeout(tick, min + Math.random() * (max - min))); }; timers.push(setTimeout(tick, min)); };
    const bell = () => {
      const t = ctx.currentTime, base = 180 + Math.random() * 60;
      for (const [mult, lvl] of [[1, 0.05], [2.76, 0.03], [5.4, 0.015]]) {
        const o = ctx.createOscillator(), g = this.#gain(0); o.frequency.value = base * mult; this.#chain(o, g, out);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
        o.start(t); o.stop(t + 6.2);
      }
    };
    const wind = level => {
      const f = this.#filter("bandpass", 420, 0.9), g = this.#gain(level);
      noise("pink", f, g);
      nodes.push(...this.#lfo(f.frequency, 0.07, 260), ...this.#lfo(g.gain, 0.11, level * 0.6));
    };
    switch (key) {
      case "snow": {   // casi silencio: aire filtrado y algún copo que cruje
        const g = this.#gain(0.12); noise("pink", this.#filter("lowpass", 500), g);
        nodes.push(...this.#lfo(g.gain, 0.05, 0.08));
        break;
      }
      case "wind": wind(0.5); break;
      case "rain": noise("white", this.#filter("highpass", 900), this.#filter("lowpass", 7000), this.#gain(0.16)); noise("brown", this.#filter("lowpass", 200), this.#gain(0.2)); break;
      case "cicadas": {
        const g = this.#gain(0.1);
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 5200; this.#chain(o, this.#filter("bandpass", 5200, 8), g, out); o.start(); nodes.push(o, g);
        nodes.push(...this.#lfo(g.gain, 38, 0.07), ...this.#lfo(g.gain, 0.12, 0.05));
        break;
      }
      case "temple": wind(0.18); every(14000, 30000, bell); break;
      case "silence":
        for (const hz of [55, 55.35]) { const o = ctx.createOscillator(), g = this.#gain(0.04); o.frequency.value = hz; this.#chain(o, g, out); o.start(); nodes.push(o, g); }
        break;
    }
    return { nodes, timers };
  }

  /** Cambia el ambiente con un fundido. */
  static setAmbient(key = "") {
    if (key === this.#current.key) return;
    this.#stopAmbient();
    this.#current.key = key;
    if (!key || !this.enabled || !AMBIENTS.includes(key)) return;
    const ctx = this.#context(); if (!ctx) return;
    const gain = this.#gain(0); gain.connect(this.#amb);
    gain.gain.setTargetAtTime(1, ctx.currentTime, 1.2);
    Object.assign(this.#current, this.#build(key, gain), { gain });
  }
  static #stopAmbient() {
    const { nodes, timers, gain } = this.#current;
    timers.forEach(clearTimeout);
    if (gain && this.#ctx) {
      gain.gain.setTargetAtTime(0, this.#ctx.currentTime, 0.4);
      setTimeout(() => { for (const n of nodes) { try { n.stop?.(); } catch {} n.disconnect(); } gain.disconnect(); }, 2000);
    }
    this.#current = { key: "", nodes: [], timers: [], gain: null };
  }
  static silence() { this.#stopAmbient(); }
  /** Aplica de nuevo los ajustes (si se apaga, calla; si se enciende, vuelve el ambiente). */
  static refresh() {
    this.volumes();
    const key = this.#current.key;
    if (!this.enabled) return this.#stopAmbient();
    if (key && !this.#current.gain) { this.#current.key = ""; this.setAmbient(key); }
  }

  /* ---------- efectos ---------- */

  static #tone(freq, duration, level = 0.05, type = "sine", when = 0, endFreq, dest = this.#sfx) {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(dest); o.start(t); o.stop(t + duration + 0.05);
  }
  static #rub(freq, duration, level, when = 0, color = "white") {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const src = ctx.createBufferSource(), f = this.#filter("bandpass", freq, 0.8), g = this.#gain(0), t = ctx.currentTime + when;
    src.buffer = this.#noiseBuffer(color); this.#chain(src, f, g, this.#sfx);
    g.gain.linearRampToValueAtTime(level, t + duration * 0.25); g.gain.linearRampToValueAtTime(0, t + duration);
    src.start(t, Math.random()); src.stop(t + duration + 0.05);
  }

  static card() { this.#rub(2600, 0.2, 0.1); this.#rub(1400, 0.1, 0.05, 0.14); }
  static brush() { this.#rub(900, 0.5, 0.08, 0, "pink"); }
  /** Piedra de go sobre madera: clic seco con un poco de resonancia. */
  static stone() { this.#rub(2400, 0.03, 0.18); this.#tone(920, 0.22, 0.06, "triangle"); this.#tone(190, 0.1, 0.07, "sine"); }
  static dice() { for (let i = 0; i < 5; i++) { this.#rub(1800 + Math.random() * 1500, 0.04, 0.14, i * 0.07 + Math.random() * 0.03); this.#tone(260 + Math.random() * 120, 0.06, 0.04, "triangle", i * 0.07); } }
  static hanko() { this.#tone(95, 0.35, 0.12, "sine", 0, 60); this.#rub(500, 0.12, 0.1); }
  static hate() { this.#tone(70, 1.4, 0.09, "sine", 0, 48); this.#tone(140.6, 1.6, 0.025, "triangle", 0.1); }
  static scar() { this.#rub(5200, 0.18, 0.1, 0, "white"); this.#tone(1760, 0.5, 0.03, "sine", 0.05); this.#tone(2349, 0.4, 0.02, "sine", 0.07); }
  static clash() { for (const [f, l] of [[1180, 0.06], [1630, 0.05], [2310, 0.04], [3140, 0.025]]) this.#tone(f, 1.8, l, "sine"); this.#rub(4500, 0.08, 0.14); }
  static taiko() { this.#tone(80, 0.7, 0.2, "sine", 0, 42); this.#rub(300, 0.15, 0.1, 0, "brown"); }
  static heartbeat() { this.#tone(58, 0.18, 0.12, "sine", 0, 42); this.#tone(52, 0.2, 0.09, "sine", 0.22, 38); }
  static win() { this.#tone(587, 0.4, 0.04); this.#tone(880, 0.6, 0.03, "sine", 0.12); }

  /** Koto sintetizado (Karplus-Strong). Un puñado de notas sueltas en la escala In; nunca un bucle. */
  static koto(notes = 3) {
    const ctx = this.#context(); if (!ctx || !this.enabled || !get("music")) return;
    const t0 = ctx.currentTime + 0.1;
    let when = 0, idx = Math.floor(Math.random() * 4);
    for (let n = 0; n < notes; n++) {
      idx = Math.max(0, Math.min(IN_SCALE.length - 1, idx + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]));
      this.#pluck(IN_SCALE[idx], t0 + when);
      when += 0.55 + Math.random() * 0.9;
    }
  }
  static #pluck(freq, at) {
    const ctx = this.#ctx, sr = ctx.sampleRate, len = Math.floor(sr * 2.4), period = Math.max(2, Math.round(sr / freq));
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1;
    for (let i = period; i < len; i++) d[i] = (d[i - period] + d[i - period + 1]) * 0.4975;
    const src = ctx.createBufferSource(), g = this.#gain(0.5);
    src.buffer = buf; src.connect(g).connect(this.#mus); src.start(at);
  }
}
