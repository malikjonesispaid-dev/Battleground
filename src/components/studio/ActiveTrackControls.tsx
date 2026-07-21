"use client";

import { Panel } from "@/components/ui/Panel";
import { Slider } from "@/components/ui/Slider";
import type { VocalTrack } from "@/lib/types";

export function ActiveTrackControls({
  track,
  onUpdate,
}: {
  track: VocalTrack | null;
  onUpdate: (id: string, patch: Partial<VocalTrack>) => void;
}) {
  if (!track) {
    return (
      <Panel title="Track Controls">
        <p className="text-sm text-neutral-500">Select a track in the timeline to edit it.</p>
      </Panel>
    );
  }

  return (
    <Panel title={`Track Controls — ${track.name}`}>
      <div className="mb-3">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Name
          <input
            value={track.name}
            onChange={(e) => onUpdate(track.id, { name: e.target.value })}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Slider
          label="Gain"
          min={0}
          max={1.5}
          value={track.gain}
          onChange={(v) => onUpdate(track.id, { gain: v })}
        />
        <Slider label="Pan" min={-1} max={1} value={track.pan} onChange={(v) => onUpdate(track.id, { pan: v })} />
        <Slider
          label="Reverb"
          min={0}
          max={1}
          value={track.reverbSend}
          onChange={(v) => onUpdate(track.id, { reverbSend: v })}
        />
      </div>
      {track.kind !== "fx" && (
        <div className="mt-3">
          <Slider
            label="AI Pitch Assist"
            min={0}
            max={1}
            value={track.pitchCorrect}
            displayValue={`${Math.round(track.pitchCorrect * 100)}%`}
            onChange={(v) => onUpdate(track.id, { pitchCorrect: v })}
          />
        </div>
      )}
    </Panel>
  );
}
