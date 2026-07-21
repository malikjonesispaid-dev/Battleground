"use client";

import { Panel } from "@/components/ui/Panel";
import { TrackRow } from "@/components/studio/TrackRow";
import type { VocalTrack } from "@/lib/types";
import { Mic } from "lucide-react";
import { MAX_TRACKS } from "@/lib/constants";

export function TrackList({
  tracks,
  trackBuffers,
  activeTrackId,
  currentTime,
  isPlaying,
  onUpdate,
  onRemove,
  onSelect,
}: {
  tracks: VocalTrack[];
  trackBuffers: Record<string, AudioBuffer>;
  activeTrackId: string | null;
  currentTime: number;
  isPlaying: boolean;
  onUpdate: (id: string, patch: Partial<VocalTrack>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel title={`Tracks (${tracks.length}/${MAX_TRACKS})`}>
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-neutral-500">
          <Mic size={22} />
          Hit Record to lay down a vocal take, or drop in a sound effect from the Vocal Hub.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((track) => {
            const buffer = trackBuffers[track.id];
            const progress =
              isPlaying && buffer ? Math.max(0, Math.min(1, (currentTime - track.offset) / buffer.duration)) : undefined;
            return (
              <TrackRow
                key={track.id}
                track={track}
                buffer={buffer}
                isActive={activeTrackId === track.id}
                progress={progress}
                onUpdate={(patch) => onUpdate(track.id, patch)}
                onRemove={() => onRemove(track.id)}
                onSelect={() => onSelect(track.id)}
              />
            );
          })}
        </div>
      )}
    </Panel>
  );
}
