import type { MasteringPresetId, MasteringSettings } from "@/lib/types";

export const MASTERING_PRESETS: Record<MasteringPresetId, Omit<MasteringSettings, "presetId">> = {
  "streaming-loud": {
    targetLufs: -9,
    bassBoost: 2,
    presenceBoost: 1.5,
    airBoost: 2,
    warmth: 0.25,
    stereoWidth: 1.1,
    compressionAmount: 0.65,
    limiterCeiling: -0.3,
  },
  "radio-ready": {
    targetLufs: -11,
    bassBoost: 1,
    presenceBoost: 2.5,
    airBoost: 1.5,
    warmth: 0.15,
    stereoWidth: 0.9,
    compressionAmount: 0.75,
    limiterCeiling: -0.5,
  },
  "warm-analog": {
    targetLufs: -13,
    bassBoost: 2.5,
    presenceBoost: 0.5,
    airBoost: 0.5,
    warmth: 0.55,
    stereoWidth: 1.0,
    compressionAmount: 0.4,
    limiterCeiling: -0.8,
  },
  "clean-podcast": {
    targetLufs: -16,
    bassBoost: 0,
    presenceBoost: 1,
    airBoost: 0.5,
    warmth: 0.05,
    stereoWidth: 0.6,
    compressionAmount: 0.5,
    limiterCeiling: -1,
  },
  "club-system": {
    targetLufs: -7,
    bassBoost: 4,
    presenceBoost: 1,
    airBoost: 1.5,
    warmth: 0.3,
    stereoWidth: 1.3,
    compressionAmount: 0.8,
    limiterCeiling: -0.2,
  },
};

export const MASTERING_PRESET_LABELS: Record<MasteringPresetId, string> = {
  "streaming-loud": "Streaming Loud",
  "radio-ready": "Radio Ready",
  "warm-analog": "Warm Analog",
  "clean-podcast": "Clean Podcast",
  "club-system": "Club System",
};

export function defaultMasteringSettings(presetId: MasteringPresetId = "streaming-loud"): MasteringSettings {
  return { presetId, ...MASTERING_PRESETS[presetId] };
}
