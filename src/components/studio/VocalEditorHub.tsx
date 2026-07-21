"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { VOICE_EFFECT_IDS, VOICE_EFFECT_LABELS } from "@/lib/audio/voiceEffects";
import { SOUND_FX_IDS, SOUND_FX_LABELS, getSoundFxBuffer, type SoundFxId } from "@/lib/audio/soundboard";
import { getAudioContext } from "@/lib/audio/context";
import { VoiceCloningPanel } from "@/components/studio/VoiceCloningPanel";
import type { VocalTrack, VoiceEffectId } from "@/lib/types";
import { MAX_TRACKS } from "@/lib/constants";
import { Mic2, Sparkles, Play } from "lucide-react";
import { useState } from "react";

function previewSoundFx(id: SoundFxId) {
  void getSoundFxBuffer(id).then((buffer) => {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  });
}

export function VocalEditorHub({
  tracks,
  trackBuffers,
  activeTrackId,
  onUpdateTrack,
  onDropSoundFx,
  onAddTrack,
}: {
  tracks: VocalTrack[];
  trackBuffers: Record<string, AudioBuffer>;
  activeTrackId: string | null;
  onUpdateTrack: (id: string, patch: Partial<VocalTrack>) => void;
  onDropSoundFx: (fxId: SoundFxId, label: string) => void;
  onAddTrack: (track: VocalTrack, buffer: AudioBuffer) => boolean;
}) {
  const [previewing, setPreviewing] = useState<SoundFxId | null>(null);
  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? null;
  const atLimit = tracks.length >= MAX_TRACKS;

  const preview = (id: SoundFxId) => {
    setPreviewing(id);
    previewSoundFx(id);
    window.setTimeout(() => setPreviewing((p) => (p === id ? null : p)), 600);
  };

  return (
    <Panel title="Vocal Editor Hub">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Mic2 size={15} className="text-fuchsia-400" />
            Voice Effects
          </div>
          {!activeTrack ? (
            <p className="text-sm text-neutral-500">Select a track below to apply a voice effect to it.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-neutral-500">
                Applying to <span className="text-neutral-300">{activeTrack.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {VOICE_EFFECT_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => onUpdateTrack(activeTrack.id, { voiceEffect: id })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTrack.voiceEffect === id
                        ? "bg-fuchsia-500 text-white"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {VOICE_EFFECT_LABELS[id as VoiceEffectId]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Sparkles size={15} className="text-fuchsia-400" />
            Soundboard
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SOUND_FX_IDS.map((id) => (
              <div key={id} className="flex flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-950/60 p-2">
                <span className="truncate text-xs font-medium text-neutral-200">{SOUND_FX_LABELS[id]}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => preview(id)}
                    className="flex-1 px-1.5"
                    aria-label={`Preview ${SOUND_FX_LABELS[id]}`}
                  >
                    <Play size={12} className={previewing === id ? "animate-pulse text-fuchsia-400" : undefined} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDropSoundFx(id, SOUND_FX_LABELS[id])}
                    disabled={atLimit}
                    className="flex-1 px-1.5 text-[11px]"
                  >
                    Drop in
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {atLimit && <p className="mt-2 text-xs text-neutral-500">Track limit reached ({MAX_TRACKS}).</p>}
        </div>
      </div>

      <VoiceCloningPanel
        tracks={tracks}
        trackBuffers={trackBuffers}
        activeTrackId={activeTrackId}
        onAddTrack={onAddTrack}
      />
    </Panel>
  );
}
