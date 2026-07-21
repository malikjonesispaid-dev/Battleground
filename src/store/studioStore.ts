import { create } from "zustand";
import type { BeatEdits, BeatSpec, LyricLine, MasteringSettings, StudioProject, VocalTrack } from "@/lib/types";
import { defaultMasteringSettings } from "@/lib/mastering/presets";

export interface MasterResultMeta {
  measuredLufsBefore: number;
  appliedGainDb: number;
  renderedAt: number;
}

/** Fills in fields that may be missing from projects saved before they existed. */
function normalizeTrack(
  track: Omit<VocalTrack, "kind" | "voiceEffect"> & Partial<Pick<VocalTrack, "kind" | "voiceEffect">>,
): VocalTrack {
  return {
    kind: "vocal",
    voiceEffect: "none",
    ...track,
  };
}

interface StudioState {
  projectId: string;
  projectName: string;
  createdAt: number;

  beatSpec: BeatSpec | null;
  beatBuffer: AudioBuffer | null;
  beatBlobKey: string | null;
  beatGain: number;
  beatEdits: BeatEdits | null;
  recentBeats: { spec: BeatSpec; buffer: AudioBuffer }[];

  tracks: VocalTrack[];
  trackBuffers: Record<string, AudioBuffer>;

  lyrics: LyricLine[];

  mastering: MasteringSettings;
  masteredBuffer: AudioBuffer | null;
  masteredMeta: MasterResultMeta | null;

  isRecording: boolean;
  isPlaying: boolean;
  activeTrackId: string | null;

  setProjectName: (name: string) => void;
  setBeat: (spec: BeatSpec, buffer: AudioBuffer, blobKey: string | null) => void;
  setBeatGain: (gain: number) => void;
  setBeatEdits: (edits: BeatEdits | null) => void;
  updateBeatBuffer: (buffer: AudioBuffer) => void;
  clearBeat: () => void;
  restoreRecentBeat: (id: string) => void;

  addTrack: (track: VocalTrack, buffer: AudioBuffer) => void;
  updateTrack: (id: string, patch: Partial<VocalTrack>) => void;
  removeTrack: (id: string) => void;
  setActiveTrackId: (id: string | null) => void;

  setLyrics: (lines: LyricLine[]) => void;
  setLyricsFromText: (text: string) => void;

  setMastering: (patch: Partial<MasteringSettings>) => void;
  setMasteringPreset: (presetId: MasteringSettings["presetId"]) => void;
  setMasteredResult: (buffer: AudioBuffer | null, meta: MasterResultMeta | null) => void;

  setIsRecording: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;

  resetProject: (opts?: { id?: string; name?: string }) => void;
  hydrateFromProject: (project: StudioProject, beatBuffer: AudioBuffer | null, trackBuffers: Record<string, AudioBuffer>) => void;
  toProjectRecord: () => Omit<StudioProject, "beatAudioKey"> & { beatAudioKey: string | null };
}

function newId(): string {
  return crypto.randomUUID();
}

export const useStudioStore = create<StudioState>((set, get) => ({
  projectId: newId(),
  projectName: "Untitled Session",
  createdAt: Date.now(),

  beatSpec: null,
  beatBuffer: null,
  beatBlobKey: null,
  beatGain: 0.9,
  beatEdits: null,
  recentBeats: [],

  tracks: [],
  trackBuffers: {},

  lyrics: [{ id: newId(), text: "" }],

  mastering: defaultMasteringSettings(),
  masteredBuffer: null,
  masteredMeta: null,

  isRecording: false,
  isPlaying: false,
  activeTrackId: null,

  setProjectName: (name) => set({ projectName: name }),

  setBeat: (spec, buffer, blobKey) =>
    set((state) => {
      const withoutDupe = state.recentBeats.filter((b) => b.spec.id !== spec.id);
      const recentBeats = [{ spec, buffer }, ...withoutDupe].slice(0, 6);
      return {
        beatSpec: spec,
        beatBuffer: buffer,
        beatBlobKey: blobKey,
        beatEdits: null,
        recentBeats,
        masteredBuffer: null,
        masteredMeta: null,
      };
    }),

  setBeatGain: (gain) => set({ beatGain: gain }),

  setBeatEdits: (edits) => set({ beatEdits: edits }),

  updateBeatBuffer: (buffer) => set({ beatBuffer: buffer, masteredBuffer: null, masteredMeta: null }),

  clearBeat: () => set({ beatSpec: null, beatBuffer: null, beatBlobKey: null, beatEdits: null }),

  restoreRecentBeat: (id) =>
    set((state) => {
      const found = state.recentBeats.find((b) => b.spec.id === id);
      if (!found) return {};
      return {
        beatSpec: found.spec,
        beatBuffer: found.buffer,
        beatBlobKey: null,
        beatEdits: null,
        masteredBuffer: null,
        masteredMeta: null,
      };
    }),

  addTrack: (track, buffer) =>
    set((state) => ({
      tracks: [...state.tracks, track],
      trackBuffers: { ...state.trackBuffers, [track.id]: buffer },
      activeTrackId: track.id,
      masteredBuffer: null,
      masteredMeta: null,
    })),

  updateTrack: (id, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      masteredBuffer: null,
      masteredMeta: null,
    })),

  removeTrack: (id) =>
    set((state) => {
      const trackBuffers = { ...state.trackBuffers };
      delete trackBuffers[id];
      return {
        tracks: state.tracks.filter((t) => t.id !== id),
        trackBuffers,
        activeTrackId: state.activeTrackId === id ? null : state.activeTrackId,
        masteredBuffer: null,
        masteredMeta: null,
      };
    }),

  setActiveTrackId: (id) => set({ activeTrackId: id }),

  setLyrics: (lines) => set({ lyrics: lines }),
  setLyricsFromText: (text) =>
    set({
      lyrics: text.split("\n").map((line) => ({ id: newId(), text: line })),
    }),

  setMastering: (patch) =>
    set((state) => ({ mastering: { ...state.mastering, ...patch }, masteredBuffer: null, masteredMeta: null })),

  setMasteringPreset: (presetId) =>
    set({ mastering: defaultMasteringSettings(presetId), masteredBuffer: null, masteredMeta: null }),

  setMasteredResult: (buffer, meta) => set({ masteredBuffer: buffer, masteredMeta: meta }),

  setIsRecording: (v) => set({ isRecording: v }),
  setIsPlaying: (v) => set({ isPlaying: v }),

  resetProject: (opts) =>
    set({
      projectId: opts?.id ?? newId(),
      projectName: opts?.name ?? "Untitled Session",
      createdAt: Date.now(),
      beatSpec: null,
      beatBuffer: null,
      beatBlobKey: null,
      beatGain: 0.9,
      beatEdits: null,
      tracks: [],
      trackBuffers: {},
      lyrics: [{ id: newId(), text: "" }],
      mastering: defaultMasteringSettings(),
      masteredBuffer: null,
      masteredMeta: null,
      isRecording: false,
      isPlaying: false,
      activeTrackId: null,
    }),

  hydrateFromProject: (project, beatBuffer, trackBuffers) =>
    set({
      projectId: project.id,
      projectName: project.name,
      createdAt: project.createdAt,
      beatSpec: project.beat,
      beatBuffer,
      beatBlobKey: project.beatAudioKey,
      beatEdits: project.beatEdits ?? null,
      tracks: project.tracks.map(normalizeTrack),
      trackBuffers,
      lyrics: project.lyrics.length ? project.lyrics : [{ id: newId(), text: "" }],
      mastering: project.mastering,
      masteredBuffer: null,
      masteredMeta: null,
      isRecording: false,
      isPlaying: false,
      activeTrackId: project.tracks[0]?.id ?? null,
    }),

  toProjectRecord: () => {
    const state = get();
    return {
      id: state.projectId,
      name: state.projectName,
      createdAt: state.createdAt,
      updatedAt: Date.now(),
      beat: state.beatSpec,
      beatAudioKey: state.beatBlobKey,
      beatEdits: state.beatEdits,
      tracks: state.tracks,
      lyrics: state.lyrics,
      mastering: state.mastering,
    };
  },
}));
