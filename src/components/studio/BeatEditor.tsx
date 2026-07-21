"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import type { BeatComposition } from "@/lib/beatgen/generator";
import {
  DEFAULT_SECTION_BARS,
  DRUM_LANES,
  MELODIC_LANES,
  getSectionDrumSteps,
  isSectionMelodicMuted,
  sectionCount,
  stepResolution,
} from "@/lib/beatgen/editing";
import type { BeatEdits, DrumLane, MelodicLane } from "@/lib/types";
import { VolumeX, Volume2 } from "lucide-react";

const DRUM_LANE_LABELS: Record<DrumLane, string> = {
  kick: "Kick",
  snare: "Snare",
  hat: "Hi-Hat",
  openHat: "Open Hat",
  perc: "Perc",
};

const MELODIC_LANE_LABELS: Record<MelodicLane, string> = {
  bass: "Bass",
  chords: "Chords",
  hook: "Hook",
};

export function BeatEditor({
  composition,
  beatEdits,
  isRendering,
  onToggleStep,
  onSetMelodicMute,
}: {
  composition: BeatComposition | null;
  beatEdits: BeatEdits | null;
  isRendering: boolean;
  onToggleStep: (sectionIndex: number, lane: DrumLane, step: number) => void;
  onSetMelodicMute: (sectionIndex: number, lane: MelodicLane, muted: boolean) => void;
}) {
  const sectionBars = beatEdits?.sectionBars ?? DEFAULT_SECTION_BARS;
  const [sectionIndex, setSectionIndex] = useState(0);

  if (!composition) {
    return (
      <Panel title="Beat Editor">
        <p className="text-sm text-neutral-500">Generate a beat first to edit its pattern.</p>
      </Panel>
    );
  }

  const resolution = stepResolution(composition);
  const totalSections = sectionCount(composition.spec.bars, sectionBars);
  const clampedSection = Math.min(sectionIndex, totalSections - 1);
  const barsPerBeat = resolution / 4;

  return (
    <Panel
      title="Beat Editor"
      action={
        <div className="flex items-center gap-1">
          {isRendering && <span className="mr-1 text-xs text-neutral-500">Applying…</span>}
          {Array.from({ length: totalSections }).map((_, i) => {
            const startBar = i * sectionBars + 1;
            const endBar = Math.min(composition.spec.bars, (i + 1) * sectionBars);
            return (
              <button
                key={i}
                onClick={() => setSectionIndex(i)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  clampedSection === i
                    ? "bg-fuchsia-500 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {startBar === endBar ? `Bar ${startBar}` : `Bars ${startBar}-${endBar}`}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {DRUM_LANES.map((lane) => {
          const activeSteps = new Set(getSectionDrumSteps(composition, beatEdits, clampedSection, lane));
          return (
            <div key={lane} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-neutral-400">{DRUM_LANE_LABELS[lane]}</span>
              <div className="flex flex-1 gap-0.5 overflow-x-auto">
                {Array.from({ length: resolution }).map((_, step) => {
                  const active = activeSteps.has(step);
                  const isBeatStart = step % barsPerBeat === 0;
                  return (
                    <button
                      key={step}
                      onClick={() => onToggleStep(clampedSection, lane, step)}
                      className={`h-5 w-3.5 shrink-0 rounded-sm transition-colors ${
                        active
                          ? "bg-fuchsia-500 hover:bg-fuchsia-400"
                          : isBeatStart
                            ? "bg-neutral-700 hover:bg-neutral-600"
                            : "bg-neutral-800 hover:bg-neutral-700"
                      }`}
                      aria-label={`${DRUM_LANE_LABELS[lane]} step ${step + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-800 pt-3">
          {MELODIC_LANES.map((lane) => {
            const muted = isSectionMelodicMuted(beatEdits, clampedSection, lane);
            return (
              <Button
                key={lane}
                variant={muted ? "danger" : "secondary"}
                size="sm"
                onClick={() => onSetMelodicMute(clampedSection, lane, !muted)}
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                {MELODIC_LANE_LABELS[lane]}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500">
          Editing a section applies to all {sectionBars === 1 ? "1 bar" : `${sectionBars} bars`} in it. Click steps
          to add or remove hits, or mute a melodic layer for this section.
        </p>
      </div>
    </Panel>
  );
}
