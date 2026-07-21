"use client";

import { useMemo, useState } from "react";
import { Mic2, Music4, Sparkles, Trash2, Volume2, VolumeX, ZoomIn, ZoomOut } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Waveform } from "@/components/studio/Waveform";
import type { BeatSpec, VocalTrack } from "@/lib/types";
import { MAX_TRACKS } from "@/lib/constants";

const ROW_HEIGHT = 52;
const MIN_PX_PER_SEC = 15;
const MAX_PX_PER_SEC = 160;

function formatRulerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function rulerInterval(pxPerSec: number): number {
  if (pxPerSec >= 80) return 1;
  if (pxPerSec >= 35) return 2;
  if (pxPerSec >= 18) return 5;
  return 10;
}

export function Timeline({
  beatBuffer,
  beatSpec,
  tracks,
  trackBuffers,
  activeTrackId,
  currentTime,
  totalDuration,
  onSeek,
  onSelectTrack,
  onUpdateTrack,
  onRemoveTrack,
}: {
  beatBuffer: AudioBuffer | null;
  beatSpec: BeatSpec | null;
  tracks: VocalTrack[];
  trackBuffers: Record<string, AudioBuffer>;
  activeTrackId: string | null;
  currentTime: number;
  totalDuration: number;
  onSeek: (t: number) => void;
  onSelectTrack: (id: string) => void;
  onUpdateTrack: (id: string, patch: Partial<VocalTrack>) => void;
  onRemoveTrack: (id: string) => void;
}) {
  const [pxPerSec, setPxPerSec] = useState(50);
  const duration = Math.max(totalDuration, 1);
  const contentWidth = Math.max(duration * pxPerSec + 80, 300);
  const interval = rulerInterval(pxPerSec);
  const anySolo = tracks.some((t) => t.solo);

  const ticks = useMemo(() => {
    const list: number[] = [];
    for (let t = 0; t <= duration; t += interval) list.push(t);
    return list;
  }, [duration, interval]);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    onSeek(Math.max(0, x / pxPerSec));
  };

  const rows: { key: string; label: string; icon: React.ReactNode; offset: number; buffer: AudioBuffer | null; color: string; track?: VocalTrack }[] = [];

  if (beatBuffer) {
    rows.push({
      key: "beat",
      label: beatSpec?.name ?? "Beat",
      icon: <Music4 size={13} className="text-violet-400" />,
      offset: 0,
      buffer: beatBuffer,
      color: "#a78bfa",
    });
  }

  for (const track of tracks) {
    rows.push({
      key: track.id,
      label: track.name,
      icon:
        track.kind === "fx" ? (
          <Sparkles size={13} className="text-amber-400" />
        ) : (
          <Mic2 size={13} className="text-cyan-400" />
        ),
      offset: track.offset,
      buffer: trackBuffers[track.id] ?? null,
      color: track.kind === "fx" ? "#fbbf24" : "#22d3ee",
      track,
    });
  }

  return (
    <Panel
      title={`Timeline · Tracks (${tracks.length}/${MAX_TRACKS})`}
      action={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPxPerSec((p) => Math.max(MIN_PX_PER_SEC, p - 15))}
            className="rounded p-1 text-neutral-400 hover:text-neutral-200"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setPxPerSec((p) => Math.min(MAX_PX_PER_SEC, p + 15))}
            className="rounded p-1 text-neutral-400 hover:text-neutral-200"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Pick a beat and record a take to see them here.</p>
      ) : (
        <div className="flex">
          <div className="flex shrink-0 flex-col" style={{ width: 160 }}>
            <div style={{ height: 24 }} />
            {rows.map((row) => (
              <div
                key={row.key}
                onClick={() => row.track && onSelectTrack(row.track.id)}
                style={{ height: ROW_HEIGHT }}
                className={`flex cursor-pointer items-center gap-1.5 border-t border-neutral-800 px-2 text-xs ${
                  row.track && activeTrackId === row.track.id ? "bg-fuchsia-500/10" : ""
                }`}
              >
                {row.icon}
                <span className="min-w-0 flex-1 truncate text-neutral-300">{row.label}</span>
                {row.track && (
                  <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpdateTrack(row.track!.id, { muted: !row.track!.muted })}
                      className={`rounded p-0.5 ${row.track.muted ? "text-red-400" : "text-neutral-500 hover:text-neutral-300"}`}
                      aria-label="Mute"
                    >
                      {row.track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button
                      onClick={() => onUpdateTrack(row.track!.id, { solo: !row.track!.solo })}
                      className={`rounded px-1 text-[9px] font-bold ${
                        row.track.solo ? "bg-yellow-400 text-black" : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      S
                    </button>
                    <button
                      onClick={() => onRemoveTrack(row.track!.id)}
                      className="rounded p-0.5 text-neutral-500 hover:text-red-400"
                      aria-label="Delete track"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <div style={{ width: contentWidth, position: "relative" }}>
              <div
                onClick={handleRulerClick}
                className="relative h-6 cursor-pointer border-b border-neutral-800"
                style={{ width: contentWidth }}
              >
                {ticks.map((t) => (
                  <div
                    key={t}
                    className="absolute top-0 h-full border-l border-neutral-800 pl-1 text-[10px] text-neutral-500"
                    style={{ left: t * pxPerSec }}
                  >
                    {formatRulerTime(t)}
                  </div>
                ))}
              </div>

              {rows.map((row) => {
                const dimmed = row.track ? row.track.muted || (anySolo && !row.track.solo) : false;
                return (
                  <div
                    key={row.key}
                    style={{ height: ROW_HEIGHT, width: contentWidth }}
                    className="relative border-t border-neutral-800"
                  >
                    {row.buffer && (
                      <div
                        style={{
                          position: "absolute",
                          left: row.offset * pxPerSec,
                          width: Math.max(4, row.buffer.duration * pxPerSec),
                          top: 4,
                          opacity: dimmed ? 0.35 : 1,
                        }}
                      >
                        <Waveform buffer={row.buffer} color={row.color} height={ROW_HEIGHT - 8} />
                      </div>
                    )}
                  </div>
                );
              })}

              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-fuchsia-400"
                style={{ left: currentTime * pxPerSec }}
              />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
