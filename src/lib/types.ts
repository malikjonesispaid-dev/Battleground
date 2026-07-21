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

export type VoiceEffectId =
  | "none"
  | "radio"
  | "telephone"
  | "robot"
  | "hall"
  | "chorus"
  | "chipmunk"
  | "deep";

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
  /** Whether this is a recorded vocal take or a dropped-in soundboard FX one-shot. */
  kind: "vocal" | "fx";
  /** Voice effect preset applied on top of pitch correction, mainly meaningful for vocal tracks. */
  voiceEffect: VoiceEffectId;
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

/** Drum lanes are edited step-by-step; melodic lanes are simple per-section mutes. */
export type DrumLane = "kick" | "snare" | "hat" | "openHat" | "perc";
export type MelodicLane = "bass" | "chords" | "hook";

export interface BeatSectionEdit {
  /** Explicit step list per drum lane, overriding the generated pattern for every bar in this section. */
  drums?: Partial<Record<DrumLane, number[]>>;
  /** true = this melodic layer is silenced for this section. */
  melodicMute?: Partial<Record<MelodicLane, boolean>>;
}

export interface BeatEdits {
  /** How many bars make up one editable section. */
  sectionBars: number;
  /** Keyed by section index (0-based). Sections with no entry use the generated pattern untouched. */
  sections: Record<number, BeatSectionEdit>;
}

export interface StudioProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  beat: BeatSpec | null;
  beatAudioKey: string | null; // key into blob store for rendered/uploaded beat audio
  beatEdits: BeatEdits | null;
  tracks: VocalTrack[];
  lyrics: LyricLine[];
  mastering: MasteringSettings;
}
