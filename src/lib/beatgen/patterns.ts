import type { Genre } from "@/lib/types";
import type { Mulberry32 } from "./theory";

export interface StepHit {
  step: number; // index within the bar's step grid
  velocity: number; // 0-1
}

export interface DrumBar {
  /** Steps per bar - 16 for straight genres, 32 to allow trap/drill hat rolls. */
  resolution: number;
  kick: StepHit[];
  snare: StepHit[];
  hat: StepHit[];
  openHat: StepHit[];
  perc: StepHit[];
}

interface GenreProfile {
  resolution: number;
  swing: number; // 0-1, shifts every other hat step
  kickDensity: number;
  hatDensity: number;
  hatRollChance: number;
  percChance: number;
  snareOnThree: boolean; // classic backbeat on 2 & 4 (or half-time on 3)
}

const GENRE_PROFILES: Record<Genre, GenreProfile> = {
  trap: { resolution: 32, swing: 0.08, kickDensity: 0.35, hatDensity: 0.75, hatRollChance: 0.35, percChance: 0.2, snareOnThree: true },
  drill: { resolution: 32, swing: 0.18, kickDensity: 0.3, hatDensity: 0.7, hatRollChance: 0.3, percChance: 0.15, snareOnThree: true },
  "boom-bap": { resolution: 16, swing: 0.12, kickDensity: 0.3, hatDensity: 0.5, hatRollChance: 0.05, percChance: 0.1, snareOnThree: false },
  lofi: { resolution: 16, swing: 0.2, kickDensity: 0.25, hatDensity: 0.4, hatRollChance: 0.03, percChance: 0.15, snareOnThree: false },
  rnb: { resolution: 16, swing: 0.15, kickDensity: 0.3, hatDensity: 0.55, hatRollChance: 0.1, percChance: 0.2, snareOnThree: false },
  pop: { resolution: 16, swing: 0.05, kickDensity: 0.35, hatDensity: 0.6, hatRollChance: 0.05, percChance: 0.1, snareOnThree: false },
  afrobeats: { resolution: 16, swing: 0.1, kickDensity: 0.4, hatDensity: 0.55, hatRollChance: 0.08, percChance: 0.45, snareOnThree: false },
  house: { resolution: 16, swing: 0.02, kickDensity: 0.5, hatDensity: 0.65, hatRollChance: 0.05, percChance: 0.25, snareOnThree: false },
};

export function getGenreProfile(genre: Genre): GenreProfile {
  return GENRE_PROFILES[genre];
}

/** Collapses multiple hits landing on the same step into one (keeping the loudest). */
function dedupeSteps(hits: StepHit[]): StepHit[] {
  const byStep = new Map<number, number>();
  for (const hit of hits) {
    const existing = byStep.get(hit.step);
    if (existing === undefined || hit.velocity > existing) {
      byStep.set(hit.step, hit.velocity);
    }
  }
  return Array.from(byStep.entries())
    .map(([step, velocity]) => ({ step, velocity }))
    .sort((a, b) => a.step - b.step);
}

function fourOnFloorKick(resolution: number): number[] {
  const stepsPerBeat = resolution / 4;
  return [0, 1, 2, 3].map((beat) => beat * stepsPerBeat);
}

/** Generates one bar of drums for the given genre, with rng-driven variation. */
export function generateDrumBar(genre: Genre, rng: Mulberry32, barIndex: number): DrumBar {
  const profile = GENRE_PROFILES[genre];
  const res = profile.resolution;
  const stepsPerBeat = res / 4;
  const bar: DrumBar = { resolution: res, kick: [], snare: [], hat: [], openHat: [], perc: [] };

  // --- Kick ---
  if (genre === "house") {
    for (const step of fourOnFloorKick(res)) {
      bar.kick.push({ step, velocity: 0.95 });
    }
  } else {
    bar.kick.push({ step: 0, velocity: 1 });
    for (let step = 1; step < res; step++) {
      if (step % stepsPerBeat === 0) continue; // leave downbeats to the anchor hit above/snare logic
      if (rng.bool(profile.kickDensity * 0.4)) {
        bar.kick.push({ step, velocity: 0.7 + rng() * 0.25 });
      }
    }
    // Occasional syncopated kick right before beat 3 (classic trap/drill push)
    if (rng.bool(0.6)) {
      const pushStep = stepsPerBeat * 2 - Math.max(1, Math.floor(stepsPerBeat / 4));
      bar.kick.push({ step: pushStep, velocity: 0.85 });
    }
  }

  // --- Snare / clap on the backbeat ---
  const backbeatSteps = profile.snareOnThree
    ? [stepsPerBeat * 2]
    : [stepsPerBeat * 1, stepsPerBeat * 3];
  for (const step of backbeatSteps) {
    bar.snare.push({ step, velocity: 1 });
  }
  if (genre === "boom-bap" && barIndex % 2 === 1 && rng.bool(0.3)) {
    bar.snare.push({ step: res - Math.max(1, Math.floor(stepsPerBeat / 2)), velocity: 0.6 });
  }

  // --- Hats ---
  for (let step = 0; step < res; step++) {
    if (rng.bool(profile.hatDensity)) {
      const isRoll = profile.hatRollChance > 0 && rng.bool(profile.hatRollChance) && step % 2 === 0;
      bar.hat.push({ step, velocity: 0.5 + rng() * 0.3 });
      if (isRoll && step + 1 < res) {
        bar.hat.push({ step: step + 1, velocity: 0.35 + rng() * 0.2 });
      }
    }
  }
  // Open hat accents on off-beats
  for (let beat = 0; beat < 4; beat++) {
    const step = beat * stepsPerBeat + Math.floor(stepsPerBeat / 2);
    if (rng.bool(0.3)) bar.openHat.push({ step, velocity: 0.6 });
  }

  // --- Percussion / shaker for genres that want it ---
  if (rng.bool(profile.percChance)) {
    for (let step = 0; step < res; step += stepsPerBeat / 2) {
      if (rng.bool(0.5)) bar.perc.push({ step: Math.round(step), velocity: 0.4 + rng() * 0.3 });
    }
  }

  bar.kick = dedupeSteps(bar.kick);
  bar.snare = dedupeSteps(bar.snare);
  bar.hat = dedupeSteps(bar.hat);
  bar.openHat = dedupeSteps(bar.openHat);
  bar.perc = dedupeSteps(bar.perc);

  return bar;
}

export function applySwing(step: number, resolution: number, swing: number): number {
  const stepDuration = 1 / resolution;
  const isOffBeat = step % 2 === 1;
  return isOffBeat ? step * stepDuration + swing * stepDuration * 0.5 : step * stepDuration;
}
