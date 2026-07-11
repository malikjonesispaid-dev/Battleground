"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { MASTERING_PRESETS, MASTERING_PRESET_LABELS } from "@/lib/mastering/presets";
import type { MasteringPresetId, MasteringSettings } from "@/lib/types";
import type { MasterResultMeta } from "@/store/studioStore";
import { Wand2, Download, Play } from "lucide-react";

export function MasteringPanel({
  mastering,
  isMastering,
  masteredMeta,
  hasMasteredBuffer,
  onPresetChange,
  onSettingChange,
  onMaster,
  onExport,
  onPreview,
}: {
  mastering: MasteringSettings;
  isMastering: boolean;
  masteredMeta: MasterResultMeta | null;
  hasMasteredBuffer: boolean;
  onPresetChange: (id: MasteringPresetId) => void;
  onSettingChange: (patch: Partial<MasteringSettings>) => void;
  onMaster: () => void;
  onExport: () => void;
  onPreview: () => void;
}) {
  return (
    <Panel title="AI Mastering">
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(MASTERING_PRESETS) as MasteringPresetId[]).map((id) => (
          <button
            key={id}
            onClick={() => onPresetChange(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mastering.presetId === id
                ? "bg-fuchsia-500 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {MASTERING_PRESET_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Slider
          label="Target loudness"
          min={-20}
          max={-6}
          step={0.5}
          value={mastering.targetLufs}
          displayValue={`${mastering.targetLufs.toFixed(1)} LUFS`}
          onChange={(v) => onSettingChange({ targetLufs: v })}
        />
        <Slider
          label="Bass"
          min={-6}
          max={6}
          value={mastering.bassBoost}
          displayValue={`${mastering.bassBoost.toFixed(1)} dB`}
          onChange={(v) => onSettingChange({ bassBoost: v })}
        />
        <Slider
          label="Presence"
          min={-6}
          max={6}
          value={mastering.presenceBoost}
          displayValue={`${mastering.presenceBoost.toFixed(1)} dB`}
          onChange={(v) => onSettingChange({ presenceBoost: v })}
        />
        <Slider
          label="Air"
          min={-6}
          max={6}
          value={mastering.airBoost}
          displayValue={`${mastering.airBoost.toFixed(1)} dB`}
          onChange={(v) => onSettingChange({ airBoost: v })}
        />
        <Slider
          label="Warmth / saturation"
          min={0}
          max={1}
          value={mastering.warmth}
          displayValue={`${Math.round(mastering.warmth * 100)}%`}
          onChange={(v) => onSettingChange({ warmth: v })}
        />
        <Slider
          label="Stereo width"
          min={0}
          max={2}
          value={mastering.stereoWidth}
          displayValue={`${Math.round(mastering.stereoWidth * 100)}%`}
          onChange={(v) => onSettingChange({ stereoWidth: v })}
        />
        <Slider
          label="Compression"
          min={0}
          max={1}
          value={mastering.compressionAmount}
          displayValue={`${Math.round(mastering.compressionAmount * 100)}%`}
          onChange={(v) => onSettingChange({ compressionAmount: v })}
        />
        <Slider
          label="Limiter ceiling"
          min={-3}
          max={-0.1}
          step={0.1}
          value={mastering.limiterCeiling}
          displayValue={`${mastering.limiterCeiling.toFixed(1)} dBFS`}
          onChange={(v) => onSettingChange({ limiterCeiling: v })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-4">
        <Button variant="primary" onClick={onMaster} disabled={isMastering}>
          <Wand2 size={16} />
          {isMastering ? "Mastering…" : "Master my track"}
        </Button>
        <Button variant="secondary" onClick={onPreview} disabled={!hasMasteredBuffer}>
          <Play size={16} /> Preview
        </Button>
        <Button variant="secondary" onClick={onExport} disabled={!hasMasteredBuffer}>
          <Download size={16} /> Export WAV
        </Button>
        {masteredMeta && (
          <span className="ml-auto text-xs text-neutral-500">
            {masteredMeta.measuredLufsBefore.toFixed(1)} → {mastering.targetLufs.toFixed(1)} LUFS (
            {masteredMeta.appliedGainDb >= 0 ? "+" : ""}
            {masteredMeta.appliedGainDb.toFixed(1)} dB applied)
          </span>
        )}
      </div>
    </Panel>
  );
}
