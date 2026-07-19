"use client";

import { clsx } from "clsx";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue?: string;
  className?: string;
}

export function Slider({ label, value, min, max, step = 0.01, onChange, displayValue, className }: SliderProps) {
  return (
    <label className={clsx("flex flex-col gap-1.5 text-sm", className)}>
      <span className="flex items-center justify-between text-neutral-400">
        <span>{label}</span>
        <span className="tabular-nums text-neutral-200">{displayValue ?? value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-fuchsia-500"
      />
    </label>
  );
}
