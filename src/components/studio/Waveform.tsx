"use client";

import { useEffect, useRef } from "react";
import { computePeaks } from "@/lib/audio/waveform";

export function Waveform({
  buffer,
  color = "#e879f9",
  progress,
  height = 56,
}: {
  buffer: AudioBuffer | null;
  color?: string;
  progress?: number; // 0-1
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!buffer) {
      ctx.strokeStyle = "#404040";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const resolution = Math.max(1, Math.floor(width));
    const peaks = computePeaks(buffer, resolution);
    const mid = height / 2;

    for (let i = 0; i < resolution; i++) {
      const min = peaks[i * 2];
      const max = peaks[i * 2 + 1];
      const playedX = progress !== undefined ? progress * resolution : -1;
      ctx.fillStyle = i <= playedX ? color : "#525252";
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      ctx.fillRect(i, Math.min(y1, y2), 1, Math.max(1, Math.abs(y2 - y1)));
    }
  }, [buffer, color, progress, height]);

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />;
}
