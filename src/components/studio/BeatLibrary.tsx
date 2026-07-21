"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Waveform } from "@/components/studio/Waveform";
import { AVAILABLE_GENRES } from "@/lib/beatgen/generator";
import { KEYS } from "@/lib/beatgen/theory";
import type { BeatSpec, Genre, Key } from "@/lib/types";
import { Dices, Sparkles, Upload } from "lucide-react";

const GENRE_LABELS: Record<Genre, string> = {
  trap: "Trap",
  drill: "Drill",
  "boom-bap": "Boom Bap",
  lofi: "Lo-Fi",
  rnb: "R&B",
  pop: "Pop",
  afrobeats: "Afrobeats",
  house: "House",
};

export function BeatLibrary({
  beatSpec,
  beatBuffer,
  beatGain,
  isGenerating,
  recentBeats,
  onGenerate,
  onRegenerate,
  onUpload,
  onSetBeatGain,
  onRestoreRecent,
}: {
  beatSpec: BeatSpec | null;
  beatBuffer: AudioBuffer | null;
  beatGain: number;
  isGenerating: boolean;
  recentBeats: { spec: BeatSpec; buffer: AudioBuffer }[];
  onGenerate: (genre: Genre, key?: Key, bars?: number) => void;
  onRegenerate: () => void;
  onUpload: (file: File) => void;
  onSetBeatGain: (v: number) => void;
  onRestoreRecent: (id: string) => void;
}) {
  const [genre, setGenre] = useState<Genre>("trap");
  const [key, setKey] = useState<Key | "random">("random");
  const [bars, setBars] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Panel title="AI Beat Engine" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Genre
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
          >
            {AVAILABLE_GENRES.map((g) => (
              <option key={g} value={g}>
                {GENRE_LABELS[g]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Key
          <select
            value={key}
            onChange={(e) => setKey(e.target.value as Key | "random")}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
          >
            <option value="random">Random</option>
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Length
          <select
            value={bars}
            onChange={(e) => setBars(parseInt(e.target.value, 10))}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
          >
            <option value={8}>Short loop</option>
            <option value={16}>Verse (16 bars)</option>
            <option value={32}>Full track (32 bars)</option>
          </select>
        </label>

        <div className="flex items-end">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={isGenerating}
            onClick={() => onGenerate(genre, key === "random" ? undefined : key, bars)}
          >
            <Sparkles size={16} />
            {isGenerating ? "Composing…" : "Generate"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={!beatSpec || isGenerating}>
          <Dices size={14} /> New variation
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}>
          <Upload size={14} /> Upload your own beat
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {beatSpec && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-100">{beatSpec.name}</span>
            <span className="text-xs text-neutral-500">
              {beatSpec.sourceAudio ? "Uploaded" : `${beatSpec.bpm} BPM · ${beatSpec.key} ${beatSpec.scale}`}
            </span>
          </div>
          <Waveform buffer={beatBuffer} color="#a78bfa" height={48} />
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <span>Beat volume</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.01}
              value={beatGain}
              onChange={(e) => onSetBeatGain(parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-violet-400"
            />
          </div>
        </div>
      )}

      {recentBeats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {recentBeats.map(({ spec }) => (
            <button
              key={spec.id}
              onClick={() => onRestoreRecent(spec.id)}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:border-violet-400 hover:text-violet-300"
            >
              {spec.name}
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
