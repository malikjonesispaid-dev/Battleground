"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PenLine, ScrollText } from "lucide-react";

export function LyricsTeleprompter({
  lyricsText,
  onChangeText,
  isPlaying,
  currentTime,
  totalDuration,
}: {
  lyricsText: string;
  onChangeText: (text: string) => void;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
}) {
  const [mode, setMode] = useState<"write" | "perform">("write");
  const [fontScale, setFontScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "perform" || !scrollRef.current) return;
    const el = scrollRef.current;
    const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = maxScroll * progress;
  }, [mode, currentTime, totalDuration]);

  const lines = lyricsText.split("\n");

  return (
    <Panel
      title="Lyrics"
      action={
        <div className="flex gap-1">
          <Button variant={mode === "write" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("write")}>
            <PenLine size={14} /> Write
          </Button>
          <Button variant={mode === "perform" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("perform")}>
            <ScrollText size={14} /> Teleprompter
          </Button>
        </div>
      }
    >
      {mode === "write" ? (
        <textarea
          value={lyricsText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={"Write your bars here...\nOne line per lyric line - the teleprompter scrolls through them as the track plays."}
          className="h-56 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-sm leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Text size</span>
            <input
              type="range"
              min={0.7}
              max={2}
              step={0.1}
              value={fontScale}
              onChange={(e) => setFontScale(parseFloat(e.target.value))}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-neutral-700 accent-fuchsia-400"
            />
            {!isPlaying && <span className="ml-auto">Press Play to auto-scroll</span>}
          </div>
          <div
            ref={scrollRef}
            className="h-64 overflow-y-auto rounded-lg border border-neutral-800 bg-black/40 p-4 text-center scroll-smooth"
          >
            {lines.map((line, i) => (
              <p
                key={i}
                style={{ fontSize: `${1.1 * fontScale}rem` }}
                className={`py-1.5 font-semibold transition-colors ${line.trim() ? "text-neutral-100" : "text-transparent"}`}
              >
                {line.trim() ? line : "·"}
              </p>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
