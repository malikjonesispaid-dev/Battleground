import type { Key, Scale } from "@/lib/types";

export const KEYS: Key[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALE_INTERVALS: Record<Scale, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

// Common Roman-numeral-ish progressions expressed as scale-degree indices (0-based).
const PROGRESSIONS: number[][] = [
  [0, 5, 3, 4], // I vi IV V
  [0, 3, 4, 3], // I IV V IV
  [5, 3, 0, 4], // vi IV I V
  [0, 4, 5, 3], // I V vi IV
  [1, 4, 0, 0], // ii V I I
  [0, 6, 3, 4], // i bVII IV V (works loosely for minor-leaning modes)
];

export interface Mulberry32 {
  (): number;
  int(max: number): number;
  pick<T>(arr: readonly T[]): T;
  bool(probability?: number): boolean;
}

/** Small deterministic PRNG so a beat can be regenerated from its seed. */
export function createRng(seed: number): Mulberry32 {
  let a = seed >>> 0;
  const rng = (() => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Mulberry32;
  rng.int = (max: number) => Math.floor(rng() * max);
  rng.pick = <T>(arr: readonly T[]) => arr[rng.int(arr.length)];
  rng.bool = (probability = 0.5) => rng() < probability;
  return rng;
}

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/** Converts a note name + octave to a frequency in Hz (A4 = 440). */
export function noteToFrequency(note: string, octave: number): number {
  const semitone = NOTE_INDEX[note];
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Returns the scale degree note names for a key/scale, wrapping across octaves as needed. */
export function scaleDegree(key: Key, scale: Scale, degree: number): { note: Key; octaveOffset: number } {
  const intervals = SCALE_INTERVALS[scale];
  const root = NOTE_INDEX[key];
  const octaveOffset = Math.floor(degree / intervals.length);
  const idx = ((degree % intervals.length) + intervals.length) % intervals.length;
  const semitone = (root + intervals[idx]) % 12;
  const note = KEYS[semitone];
  return { note, octaveOffset };
}

export interface ChordVoicing {
  degree: number;
  notes: { note: Key; octave: number }[];
}

/** Builds a diatonic triad (with occasional 7th) stacked on the given scale degree. */
export function buildChord(
  key: Key,
  scale: Scale,
  degree: number,
  baseOctave: number,
  includeSeventh: boolean,
): ChordVoicing {
  const thirds = [0, 2, 4];
  if (includeSeventh) thirds.push(6);
  const notes = thirds.map((offset) => {
    const { note, octaveOffset } = scaleDegree(key, scale, degree + offset);
    return { note, octave: baseOctave + octaveOffset };
  });
  return { degree, notes };
}

export function pickProgression(rng: Mulberry32): number[] {
  return rng.pick(PROGRESSIONS);
}
