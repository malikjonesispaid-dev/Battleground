// Shared domain types for the studio.

export type Genre =
  | "trap"
  | "boom-bap"
  | "lofi"
  | "drill"
  | "rnb"
  | "pop"
  | "afrobeats"
  | "house";

export type Key =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type Scale = "major" | "minor" | "dorian" | "phrygian";

export interface BeatSpec {
  id: string;
  name: string;
  genre: Genre;
  bpm: number;
  key: Key;
  scale: Scale;
  bars: number;
  seed: number;
  createdAt: number;
  /** Present when the beat came from an uploaded audio file instead of being generated. */
  sourceAudio?: {
    fileName: string;
  };
}

export interface VocalTrack {
  id: string;
  name: string;
  createdAt: number;
  /** Duration in seconds. */
  duration: number;
  gain: number; // 0 - 1.5
  pan: number; // -1 - 1
  muted: boolean;
  solo: boolean;
  /** Effects sends, 0-1 */
  reverbSend: number;
  /** Pitch correction strength, 0 = off, 1 = fully snapped */
  pitchCorrect: number;
  /** Offset in seconds from the start of the project timeline. */
  offset: number;
}

export type MasteringPresetId =
  | "streaming-loud"
  | "radio-ready"
  | "warm-analog"
  | "clean-podcast"
  | "club-system";

export interface MasteringSettings {
  presetId: MasteringPresetId;
  targetLufs: number;
  bassBoost: number; // -6..6 dB
  presenceBoost: number; // -6..6 dB
  airBoost: number; // -6..6 dB
  warmth: number; // 0..1 saturation amount
  stereoWidth: number; // 0..2
  compressionAmount: number; // 0..1
  limiterCeiling: number; // dBFS, e.g. -0.3
}

export interface LyricLine {
  id: string;
  text: string;
}

export interface StudioProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  beat: BeatSpec | null;
  beatAudioKey: string | null; // key into blob store for rendered/uploaded beat audio
  tracks: VocalTrack[];
  lyrics: LyricLine[];
  mastering: MasteringSettings;
}
