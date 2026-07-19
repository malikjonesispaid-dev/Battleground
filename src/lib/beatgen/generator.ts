import type { BeatSpec, Genre, Key, Scale } from "@/lib/types";
import { buildChord, createRng, pickProgression, type ChordVoicing } from "./theory";
import { generateDrumBar, getGenreProfile, type DrumBar } from "./patterns";
import { KEYS } from "./theory";

const GENRE_BPM_RANGE: Record<Genre, [number, number]> = {
  trap: [130, 155],
  drill: [136, 145],
  "boom-bap": [85, 96],
  lofi: [70, 90],
  rnb: [60, 80],
  pop: [96, 118],
  afrobeats: [100, 115],
  house: [120, 128],
};

const GENRE_SCALE_BIAS: Record<Genre, Scale[]> = {
  trap: ["minor", "phrygian"],
  drill: ["minor", "phrygian"],
  "boom-bap": ["minor", "dorian"],
  lofi: ["major", "dorian"],
  rnb: ["minor", "dorian", "major"],
  pop: ["major", "minor"],
  afrobeats: ["major", "dorian"],
  house: ["minor", "major"],
};

export interface GenerateBeatOptions {
  genre: Genre;
  bpm?: number;
  key?: Key;
  scale?: Scale;
  bars?: number;
  seed?: number;
  name?: string;
}

export function createBeatSpec(options: GenerateBeatOptions): BeatSpec {
  const rng = createRng(options.seed ?? Math.floor(Math.random() * 2 ** 31));
  const [minBpm, maxBpm] = GENRE_BPM_RANGE[options.genre];
  const bpm = options.bpm ?? Math.round(minBpm + rng() * (maxBpm - minBpm));
  const key = options.key ?? rng.pick(KEYS);
  const scale = options.scale ?? rng.pick(GENRE_SCALE_BIAS[options.genre]);
  const bars = options.bars ?? 8;
  const seed = options.seed ?? Math.floor(rng() * 2 ** 31);

  return {
    id: crypto.randomUUID(),
    name: options.name ?? `${capitalize(options.genre)} Beat in ${key} ${scale}`,
    genre: options.genre,
    bpm,
    key,
    scale,
    bars,
    seed,
    createdAt: Date.now(),
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface BassNote {
  step: number;
  note: Key;
  octave: number;
  durationSteps: number;
  velocity: number;
}

export interface HookNote {
  step: number;
  note: Key;
  octave: number;
  durationSteps: number;
  velocity: number;
}

export interface BeatComposition {
  spec: BeatSpec;
  progression: number[];
  chordsPerBar: ChordVoicing[];
  drumBars: DrumBar[];
  bassPerBar: BassNote[][];
  hookPerBar: HookNote[][];
}

/**
 * Deterministically re-derives the full musical composition (drums, chords,
 * bass, hook) from a BeatSpec. Same spec + seed always produces the same
 * beat, so specs are cheap to persist and beats are cheap to regenerate.
 */
export function composeBeat(spec: BeatSpec): BeatComposition {
  const rng = createRng(spec.seed);
  const profile = getGenreProfile(spec.genre);
  const progression = pickProgression(rng);
  const includeSeventh = spec.genre === "rnb" || spec.genre === "lofi";

  const chordsPerBar: ChordVoicing[] = [];
  const drumBars: DrumBar[] = [];
  const bassPerBar: BassNote[][] = [];
  const hookPerBar: HookNote[][] = [];

  const wantsHook = spec.genre === "pop" || spec.genre === "rnb" || spec.genre === "afrobeats" || spec.genre === "lofi";

  for (let bar = 0; bar < spec.bars; bar++) {
    const degree = progression[bar % progression.length];
    const chord = buildChord(spec.key, spec.scale, degree, 3, includeSeventh);
    chordsPerBar.push(chord);

    drumBars.push(generateDrumBar(spec.genre, rng, bar));

    const res = profile.resolution;
    const stepsPerBeat = res / 4;
    const bass: BassNote[] = [];
    const root = chord.notes[0];
    // Root on beat 1, occasional fifth/octave movement to keep it alive.
    bass.push({ step: 0, note: root.note, octave: root.octave - 1, durationSteps: stepsPerBeat * 2, velocity: 0.9 });
    if (rng.bool(0.6)) {
      const fifth = chord.notes[2] ?? root;
      bass.push({
        step: stepsPerBeat * 2,
        note: fifth.note,
        octave: fifth.octave - 1,
        durationSteps: stepsPerBeat * 2,
        velocity: 0.75,
      });
    } else {
      bass.push({ step: stepsPerBeat * 2, note: root.note, octave: root.octave - 1, durationSteps: stepsPerBeat * 2, velocity: 0.8 });
    }
    bassPerBar.push(bass);

    const hook: HookNote[] = [];
    if (wantsHook && rng.bool(0.85)) {
      const noteCount = rng.int(3) + 2;
      const usedSteps = new Set<number>();
      for (let i = 0; i < noteCount; i++) {
        const tone = chord.notes[rng.int(chord.notes.length)];
        const step = rng.int(res);
        if (usedSteps.has(step)) continue;
        usedSteps.add(step);
        hook.push({
          step,
          note: tone.note,
          octave: tone.octave + 1,
          durationSteps: Math.max(1, Math.floor(res / (noteCount * 2))),
          velocity: 0.5 + rng() * 0.3,
        });
      }
      hook.sort((a, b) => a.step - b.step);
    }
    hookPerBar.push(hook);
  }

  return { spec, progression, chordsPerBar, drumBars, bassPerBar, hookPerBar };
}

export const AVAILABLE_GENRES: Genre[] = [
  "trap",
  "drill",
  "boom-bap",
  "lofi",
  "rnb",
  "pop",
  "afrobeats",
  "house",
];
