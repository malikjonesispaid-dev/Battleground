"use client";

import { Circle, Pause, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export function Transport({
  isPlaying,
  isRecording,
  currentTime,
  hasContent,
  onTogglePlay,
  onRecord,
  onStopRecording,
  onRewind,
}: {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  hasContent: boolean;
  onTogglePlay: () => void;
  onRecord: () => void;
  onStopRecording: () => void;
  onRewind: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3">
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
        <Button variant="danger" size="sm" onClick={onRecord} disabled={isPlaying} aria-label="Record">
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
  );
}
