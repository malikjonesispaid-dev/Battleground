import type { BeatEdits, DrumLane, MelodicLane } from "@/lib/types";
import type { BeatComposition } from "./generator";
import { getGenreProfile } from "./patterns";

export const DEFAULT_SECTION_BARS = 4;

export function createEmptyBeatEdits(sectionBars: number = DEFAULT_SECTION_BARS): BeatEdits {
  return { sectionBars, sections: {} };
}

export function sectionCount(totalBars: number, sectionBars: number): number {
  return Math.max(1, Math.ceil(totalBars / sectionBars));
}

/** The step pattern currently shown/edited for a lane in a section - the override if one exists, else the generated pattern from the section's first bar. */
export function getSectionDrumSteps(
  composition: BeatComposition,
  edits: BeatEdits | null,
  sectionIndex: number,
  lane: DrumLane,
): number[] {
  const override = edits?.sections[sectionIndex]?.drums?.[lane];
  if (override) return override;
  const sectionBars = edits?.sectionBars ?? DEFAULT_SECTION_BARS;
  const firstBar = composition.drumBars[sectionIndex * sectionBars];
  return firstBar ? firstBar[lane].map((hit) => hit.step) : [];
}

export function isSectionMelodicMuted(edits: BeatEdits | null, sectionIndex: number, lane: MelodicLane): boolean {
  return edits?.sections[sectionIndex]?.melodicMute?.[lane] ?? false;
}

export function toggleDrumStep(
  composition: BeatComposition,
  edits: BeatEdits | null,
  sectionIndex: number,
  lane: DrumLane,
  step: number,
): BeatEdits {
  const base = edits ?? createEmptyBeatEdits();
  const current = getSectionDrumSteps(composition, edits, sectionIndex, lane);
  const has = current.includes(step);
  const next = has ? current.filter((s) => s !== step) : [...current, step].sort((a, b) => a - b);

  const existingSection = base.sections[sectionIndex] ?? {};
  return {
    ...base,
    sections: {
      ...base.sections,
      [sectionIndex]: {
        ...existingSection,
        drums: { ...existingSection.drums, [lane]: next },
      },
    },
  };
}

export function setMelodicMute(
  edits: BeatEdits | null,
  sectionIndex: number,
  lane: MelodicLane,
  muted: boolean,
): BeatEdits {
  const base = edits ?? createEmptyBeatEdits();
  const existingSection = base.sections[sectionIndex] ?? {};
  return {
    ...base,
    sections: {
      ...base.sections,
      [sectionIndex]: {
        ...existingSection,
        melodicMute: { ...existingSection.melodicMute, [lane]: muted },
      },
    },
  };
}

/**
 * Overlays user edits onto a generated composition: explicit step overrides
 * replace a drum lane's pattern for every bar in that section, and muted
 * melodic layers are silenced for their section's bars.
 */
export function applyBeatEdits(composition: BeatComposition, edits: BeatEdits | null): BeatComposition {
  if (!edits || Object.keys(edits.sections).length === 0) return composition;
  const { sectionBars, sections } = edits;

  const drumBars = composition.drumBars.map((bar, barIndex) => {
    const sectionEdit = sections[Math.floor(barIndex / sectionBars)];
    if (!sectionEdit?.drums) return bar;
    const next = { ...bar };
    for (const [lane, steps] of Object.entries(sectionEdit.drums) as [DrumLane, number[] | undefined][]) {
      if (!steps) continue;
      next[lane] = steps.map((step) => ({ step, velocity: 0.85 }));
    }
    return next;
  });

  const bassPerBar = composition.bassPerBar.map((notes, barIndex) => {
    const sectionEdit = sections[Math.floor(barIndex / sectionBars)];
    return sectionEdit?.melodicMute?.bass ? [] : notes;
  });

  const chordsPerBar = composition.chordsPerBar.map((chord, barIndex) => {
    const sectionEdit = sections[Math.floor(barIndex / sectionBars)];
    return sectionEdit?.melodicMute?.chords ? { ...chord, notes: [] } : chord;
  });

  const hookPerBar = composition.hookPerBar.map((notes, barIndex) => {
    const sectionEdit = sections[Math.floor(barIndex / sectionBars)];
    return sectionEdit?.melodicMute?.hook ? [] : notes;
  });

  return { ...composition, drumBars, bassPerBar, chordsPerBar, hookPerBar };
}

export const DRUM_LANES: DrumLane[] = ["kick", "snare", "hat", "openHat", "perc"];
export const MELODIC_LANES: MelodicLane[] = ["bass", "chords", "hook"];

export function stepResolution(composition: BeatComposition): number {
  return getGenreProfile(composition.spec.genre).resolution;
}
