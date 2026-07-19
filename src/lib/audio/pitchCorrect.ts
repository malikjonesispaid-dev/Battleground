import type { Key, Scale } from "@/lib/types";
import { noteToFrequency, scaleDegree } from "@/lib/beatgen/theory";

const MIN_VOCAL_HZ = 70;
const MAX_VOCAL_HZ = 900;

/** All frequencies of the given scale across the vocal range, used as pitch-correction snap targets. */
function buildScaleFrequencies(key: Key, scale: Scale): number[] {
  const freqs: number[] = [];
  for (let octave = 1; octave <= 6; octave++) {
    for (let degree = 0; degree < 7; degree++) {
      const { note, octaveOffset } = scaleDegree(key, scale, degree);
      const freq = noteToFrequency(note, octave + octaveOffset);
      if (freq >= MIN_VOCAL_HZ && freq <= MAX_VOCAL_HZ) freqs.push(freq);
    }
  }
  return freqs.sort((a, b) => a - b);
}

function nearestFrequency(target: number, options: number[]): number {
  let best = target;
  let bestDist = Infinity;
  for (const f of options) {
    const dist = Math.abs(Math.log2(f / target));
    if (dist < bestDist) {
      bestDist = dist;
      best = f;
    }
  }
  return best;
}

/** Autocorrelation-based pitch detector for a single windowed frame. Returns 0 if no clear pitch found. */
function detectPitch(frame: Float32Array<ArrayBufferLike>, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / MAX_VOCAL_HZ);
  const maxPeriod = Math.floor(sampleRate / MIN_VOCAL_HZ);

  let rms = 0;
  for (let i = 0; i < frame.length; i++) rms += frame[i] * frame[i];
  rms = Math.sqrt(rms / frame.length);
  if (rms < 0.01) return 0; // silence / noise floor - don't try to detect

  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = minPeriod; offset <= maxPeriod && offset < frame.length / 2; offset++) {
    let correlation = 0;
    for (let i = 0; i < frame.length - offset; i++) {
      correlation += frame[i] * frame[i + offset];
    }
    correlation = correlation / (frame.length - offset);
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestOffset <= 0 || bestCorrelation < rms * rms * 0.3) return 0;
  return sampleRate / bestOffset;
}

function hannWindow(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return w;
}

/**
 * Lightweight granular pitch-correction: detects the fundamental of each
 * overlapping frame and nudges it toward the nearest note in the target
 * scale, blended by `strength` (0 = no effect, 1 = fully snapped).
 * This is a practical approximation of auto-tune, not a studio-grade
 * formant-preserving pitch corrector.
 */
export function applyPitchCorrection(
  input: Float32Array<ArrayBufferLike>,
  sampleRate: number,
  key: Key,
  scale: Scale,
  strength: number,
): Float32Array<ArrayBufferLike> {
  if (strength <= 0) return input;

  const frameSize = 2048;
  const hopSize = 512;
  const window = hannWindow(frameSize);
  const scaleFreqs = buildScaleFrequencies(key, scale);

  const output = new Float32Array(input.length);
  const normalization = new Float32Array(input.length);

  for (let start = 0; start + frameSize <= input.length; start += hopSize) {
    const frame = input.subarray(start, start + frameSize);
    const detected = detectPitch(frame, sampleRate);

    let ratio = 1;
    if (detected > 0) {
      const target = nearestFrequency(detected, scaleFreqs);
      const fullRatio = target / detected;
      ratio = 1 + (fullRatio - 1) * strength;
      ratio = Math.max(0.7, Math.min(1.4, ratio));
    }

    for (let i = 0; i < frameSize; i++) {
      const srcIndex = i * ratio;
      const idx0 = Math.floor(srcIndex);
      const idx1 = idx0 + 1;
      if (idx1 >= frameSize) continue;
      const frac = srcIndex - idx0;
      const sample = frame[idx0] * (1 - frac) + frame[idx1] * frac;
      const w = window[i];
      const outIdx = start + i;
      if (outIdx < output.length) {
        output[outIdx] += sample * w;
        normalization[outIdx] += w;
      }
    }
  }

  for (let i = 0; i < output.length; i++) {
    output[i] = normalization[i] > 1e-6 ? output[i] / normalization[i] : input[i];
  }

  return output;
}
