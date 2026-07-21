"use client";

import { Circle, Pause, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export function Transport({
  isPlaying,
  isRecording,
  currentTime,
  totalDuration,
  hasContent,
  onTogglePlay,
  onRecord,
  onStopRecording,
  onRewind,
  onSeek,
  atTrackLimit = false,
}: {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  totalDuration: number;
  hasContent: boolean;
  onTogglePlay: () => void;
  onRecord: () => void;
  onStopRecording: () => void;
  onRewind: () => void;
  onSeek: (t: number) => void;
  atTrackLimit?: boolean;
}) {
  const scrubMax = Math.max(totalDuration, currentTime, 0.1);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onRewind} disabled={isRecording} aria-label="Rewind">
          <RotateCcw size={16} />
        </Button>

        {!isRecording ? (
          <Button variant="primary" size="sm" onClick={onTogglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            <Play size={16} /> Play
          </Button>
        )}

        {!isRecording ? (
          <Button
            variant="danger"
            size="sm"
            onClick={onRecord}
            disabled={isPlaying || atTrackLimit}
            aria-label="Record"
            title={atTrackLimit ? "Track limit reached - delete a track to record a new one" : undefined}
          >
            <Circle size={16} fill="currentColor" /> Record
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={onStopRecording}
            className="animate-pulse"
            aria-label="Stop recording"
          >
            <Square size={16} fill="currentColor" /> Stop
          </Button>
        )}

        <div className="ml-2 font-mono text-sm tabular-nums text-neutral-300">{formatTime(currentTime)}</div>

        {!hasContent && <div className="ml-auto text-xs text-neutral-500">Pick a beat to get started</div>}
      </div>

      {hasContent && (
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-right font-mono text-[11px] text-neutral-500">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={scrubMax}
            step={0.05}
            value={Math.min(currentTime, scrubMax)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={isRecording}
            aria-label="Seek"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span className="w-12 shrink-0 font-mono text-[11px] text-neutral-500">{formatTime(totalDuration)}</span>
        </div>
      )}
    </div>
  );
}
