import * as Tone from "tone";

export type SoundFxId =
  | "airhorn"
  | "boom808"
  | "laser"
  | "scratch"
  | "riser"
  | "siren"
  | "chime"
  | "impact";

export const SOUND_FX_LABELS: Record<SoundFxId, string> = {
  airhorn: "Air Horn",
  boom808: "808 Boom",
  laser: "Laser Zap",
  scratch: "Vinyl Scratch",
  riser: "Riser",
  siren: "Siren",
  chime: "Chime",
  impact: "Impact",
};

export const SOUND_FX_IDS: SoundFxId[] = [
  "airhorn",
  "boom808",
  "laser",
  "scratch",
  "riser",
  "siren",
  "chime",
  "impact",
];

async function renderOneShot(
  build: (destination: Tone.ToneAudioNode) => void,
  duration: number,
): Promise<AudioBuffer> {
  const toneBuffer = await Tone.Offline((context) => {
    build(context.destination);
  }, duration);
  const buffer = toneBuffer.get();
  if (!buffer) throw new Error("Failed to render sound effect.");
  return buffer;
}

function buildAirhorn(destination: Tone.ToneAudioNode): void {
  const filter = new Tone.Filter(1800, "lowpass").connect(destination);
  const env = new Tone.Volume(-4).connect(filter);
  const now = Tone.getContext().currentTime;
  const detunes = [-8, 0, 8, 1200]; // stacked voices + an octave for thickness
  for (const detune of detunes) {
    const osc = new Tone.Oscillator({ type: "sawtooth", frequency: 370 }).connect(env);
    osc.detune.value = detune;
    osc.start(now).stop(now + 0.85);
    osc.frequency.setValueAtTime(370, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.85);
  }
  env.volume.setValueAtTime(-4, now);
  env.volume.linearRampToValueAtTime(-2, now + 0.05);
  env.volume.setValueAtTime(-2, now + 0.65);
  env.volume.linearRampToValueAtTime(-40, now + 0.85);
}

function buildBoom808(destination: Tone.ToneAudioNode): void {
  const synth = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 5,
    envelope: { attack: 0.001, decay: 1.1, sustain: 0.05, release: 0.6 },
  }).connect(destination);
  synth.volume.value = 2;
  synth.triggerAttackRelease("C1", 1.2);
}

function buildLaser(destination: Tone.ToneAudioNode): void {
  const filter = new Tone.Filter(4000, "lowpass").connect(destination);
  const vol = new Tone.Volume(-2).connect(filter);
  const osc = new Tone.Oscillator({ type: "sawtooth", frequency: 1800 }).connect(vol);
  const now = Tone.getContext().currentTime;
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
  vol.volume.setValueAtTime(-2, now);
  vol.volume.linearRampToValueAtTime(-40, now + 0.4);
  osc.start(now).stop(now + 0.45);
}

function buildScratch(destination: Tone.ToneAudioNode): void {
  // "Scratch" gesture: rapid back-and-forth filter sweeps + gating on filtered noise.
  const gate = new Tone.Volume(0).connect(destination);
  const filter = new Tone.Filter(1200, "bandpass").connect(gate);
  filter.Q.value = 2;
  const noise = new Tone.Noise("white").connect(filter);
  const now = Tone.getContext().currentTime;
  noise.start(now);
  noise.stop(now + 0.9);
  const sweeps = 6;
  for (let i = 0; i < sweeps; i++) {
    const t = now + i * 0.13;
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.06);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.12);
    gate.volume.setValueAtTime(i % 2 === 0 ? -2 : -18, t);
  }
  gate.volume.linearRampToValueAtTime(-40, now + 0.9);
}

function buildRiser(destination: Tone.ToneAudioNode): void {
  const vol = new Tone.Volume(-30).connect(destination);
  const filter = new Tone.Filter(200, "highpass").connect(vol);
  const noise = new Tone.Noise("white").connect(filter);
  const now = Tone.getContext().currentTime;
  const dur = 1.8;
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(9000, now + dur);
  vol.volume.setValueAtTime(-30, now);
  vol.volume.linearRampToValueAtTime(-2, now + dur);
  noise.start(now).stop(now + dur + 0.05);
}

function buildSiren(destination: Tone.ToneAudioNode): void {
  const osc = new Tone.Oscillator({ type: "square", frequency: 500 }).connect(destination);
  const now = Tone.getContext().currentTime;
  const dur = 1.6;
  const cycles = 4;
  for (let i = 0; i < cycles; i++) {
    const t = now + (i * dur) / cycles;
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(900, t + dur / cycles / 2);
    osc.frequency.linearRampToValueAtTime(500, t + dur / cycles);
  }
  osc.volume.value = -10;
  osc.start(now).stop(now + dur);
}

function buildChime(destination: Tone.ToneAudioNode): void {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 1.4, sustain: 0, release: 1.2 },
  }).connect(destination);
  synth.volume.value = -6;
  synth.triggerAttackRelease(["C6", "E6", "G6"], 1.4);
}

function buildImpact(destination: Tone.ToneAudioNode): void {
  const noiseFilter = new Tone.Filter(2500, "lowpass").connect(destination);
  const noiseEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }).connect(
    noiseFilter,
  );
  const noise = new Tone.Noise("white").connect(noiseEnv);
  const now = Tone.getContext().currentTime;
  noise.start(now).stop(now + 0.3);
  noiseEnv.triggerAttackRelease(0.25, now);

  const thump = new Tone.MembraneSynth({
    pitchDecay: 0.15,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.4 },
  }).connect(destination);
  thump.volume.value = 1;
  thump.triggerAttackRelease("A0", 0.8, now);
}

const BUILDERS: Record<SoundFxId, { build: (destination: Tone.ToneAudioNode) => void; duration: number }> = {
  airhorn: { build: buildAirhorn, duration: 1.0 },
  boom808: { build: buildBoom808, duration: 1.4 },
  laser: { build: buildLaser, duration: 0.6 },
  scratch: { build: buildScratch, duration: 1.0 },
  riser: { build: buildRiser, duration: 2.0 },
  siren: { build: buildSiren, duration: 1.7 },
  chime: { build: buildChime, duration: 1.6 },
  impact: { build: buildImpact, duration: 1.0 },
};

const cache = new Map<SoundFxId, Promise<AudioBuffer>>();

/** Renders (and caches) a synthesized one-shot sound effect. */
export function getSoundFxBuffer(id: SoundFxId): Promise<AudioBuffer> {
  let cached = cache.get(id);
  if (!cached) {
    const entry = BUILDERS[id];
    cached = renderOneShot(entry.build, entry.duration);
    cache.set(id, cached);
  }
  return cached;
}
