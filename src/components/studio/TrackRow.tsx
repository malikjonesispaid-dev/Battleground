"use client";

import { Trash2, Volume2, VolumeX, Mic2, Sparkles } from "lucide-react";
import { Waveform } from "@/components/studio/Waveform";
import type { VocalTrack } from "@/lib/types";
import { VOICE_EFFECT_LABELS } from "@/lib/audio/voiceEffects";

export function TrackRow({
  track,
  buffer,
  isActive,
  progress,
  onUpdate,
  onRemove,
  onSelect,
}: {
  track: VocalTrack;
  buffer: AudioBuffer | undefined;
  isActive: boolean;
  progress: number | undefined;
  onUpdate: (patch: Partial<VocalTrack>) => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors ${
        isActive ? "border-fuchsia-500/60 bg-fuchsia-500/5" : "border-neutral-800 bg-neutral-950/40"
      }`}
    >
      <div className="flex items-center gap-2">
        {track.kind === "fx" ? (
          <Sparkles size={13} className="shrink-0 text-amber-400" aria-label="Sound effect" />
        ) : (
          <Mic2 size={13} className="shrink-0 text-cyan-400" aria-label="Vocal take" />
        )}
        <input
          value={track.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium text-neutral-100 outline-none"
        />
        {track.voiceEffect !== "none" && (
          <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300">
            {VOICE_EFFECT_LABELS[track.voiceEffect]}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ muted: !track.muted });
          }}
          className={`rounded p-1 ${track.muted ? "text-red-400" : "text-neutral-400 hover:text-neutral-200"}`}
          aria-label="Mute"
        >
          {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ solo: !track.solo });
          }}
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            track.solo ? "bg-yellow-400 text-black" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          S
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-1 text-neutral-500 hover:text-red-400"
          aria-label="Delete track"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Waveform buffer={buffer ?? null} color="#22d3ee" progress={progress} height={40} />

      <div className="grid grid-cols-3 gap-3 text-xs text-neutral-400">
        <label className="flex flex-col gap-1">
          Gain
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.01}
            value={track.gain}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ gain: parseFloat(e.target.value) })}
            className="h-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-cyan-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          Pan
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={track.pan}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ pan: parseFloat(e.target.value) })}
            className="h-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-cyan-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          Reverb
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.reverbSend}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ reverbSend: parseFloat(e.target.value) })}
            className="h-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-cyan-400"
          />
        </label>
      </div>

      {track.kind !== "fx" && (
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="whitespace-nowrap">AI Pitch Assist</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.pitchCorrect}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ pitchCorrect: parseFloat(e.target.value) })}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-emerald-400"
          />
          <span className="w-8 tabular-nums text-neutral-300">{Math.round(track.pitchCorrect * 100)}%</span>
        </label>
      )}
    </div>
  );
}
