import type { VoiceEffectId } from "@/lib/types";

export const VOICE_EFFECT_LABELS: Record<VoiceEffectId, string> = {
  none: "Dry",
  radio: "Radio",
  telephone: "Telephone",
  robot: "Robot",
  hall: "Hall Reverb",
  chorus: "Chorus / Doubler",
  chipmunk: "Chipmunk",
  deep: "Deep / Giant",
};

export const VOICE_EFFECT_IDS: VoiceEffectId[] = [
  "none",
  "radio",
  "telephone",
  "robot",
  "hall",
  "chorus",
  "chipmunk",
  "deep",
];

/**
 * Effects that change pitch/speed are applied via the source node's
 * playbackRate rather than a downstream effect chain.
 */
export function getPlaybackRateForEffect(effect: VoiceEffectId): number {
  if (effect === "chipmunk") return 1.45;
  if (effect === "deep") return 0.72;
  return 1;
}

function buildReverbImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

/**
 * Builds a Web Audio node graph for effects that shape tone (as opposed to
 * chipmunk/deep, which just change playback rate on the source). Works in
 * both realtime AudioContext and OfflineAudioContext since it only uses
 * plain nodes (filters, waveshaper, convolver, delay).
 */
export function buildVoiceEffectChain(
  ctx: BaseAudioContext,
  effect: VoiceEffectId,
): { input: AudioNode; output: AudioNode } {
  const input = ctx.createGain();

  if (effect === "none" || effect === "chipmunk" || effect === "deep") {
    return { input, output: input };
  }

  if (effect === "radio") {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 0.7;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 3);
    }
    shaper.curve = curve;
    const output = ctx.createGain();
    output.gain.value = 1.4;
    input.connect(bandpass).connect(shaper).connect(output);
    return { input, output };
  }

  if (effect === "telephone") {
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 500;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2800;
    const crush = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    const steps = 12;
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    crush.curve = curve;
    const output = ctx.createGain();
    output.gain.value = 1.3;
    input.connect(highpass).connect(lowpass).connect(crush).connect(output);
    return { input, output };
  }

  if (effect === "robot") {
    // Ring modulation: a low square-wave oscillator drives the ring node's
    // gain param directly, giving the classic metallic/robotic timbre.
    const carrier = ctx.createOscillator();
    carrier.type = "square";
    carrier.frequency.value = 55;
    carrier.start();

    const ringMod = ctx.createGain();
    ringMod.gain.value = 0;
    input.connect(ringMod);
    carrier.connect(ringMod.gain);

    const comb = ctx.createBiquadFilter();
    comb.type = "peaking";
    comb.frequency.value = 900;
    comb.Q.value = 4;
    comb.gain.value = 6;

    const output = ctx.createGain();
    ringMod.connect(comb).connect(output);
    return { input, output };
  }

  if (effect === "hall") {
    const convolver = ctx.createConvolver();
    convolver.buffer = buildReverbImpulse(ctx, 3.2, 2.4);
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.55;
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.7;
    const output = ctx.createGain();
    input.connect(dryGain).connect(output);
    input.connect(convolver).connect(wetGain).connect(output);
    return { input, output };
  }

  // chorus / doubler
  const delay = ctx.createDelay(0.05);
  delay.delayTime.value = 0.022;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.9;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.004;
  lfo.connect(lfoDepth).connect(delay.delayTime);
  lfo.start();

  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.6;
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.9;
  const output = ctx.createGain();
  input.connect(dryGain).connect(output);
  input.connect(delay).connect(wetGain).connect(output);
  return { input, output };
}
