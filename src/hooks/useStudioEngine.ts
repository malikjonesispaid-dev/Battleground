"use client";

import { useCallback, useRef, useState } from "react";
import { useStudioStore } from "@/store/studioStore";
import { getAudioContext, decodeAudioFile } from "@/lib/audio/context";
import { startVocalRecording, type RecorderHandle } from "@/lib/audio/recorder";
import { playbackEngine } from "@/lib/audio/livePlayback";
import { renderMixdown } from "@/lib/audio/mixdown";
import { renderMaster as renderMasterChain } from "@/lib/mastering/chain";
import { audioBufferToWav } from "@/lib/audio/wav";
import { downloadBlob } from "@/lib/download";
import { createBeatSpec, composeBeat, type GenerateBeatOptions } from "@/lib/beatgen/generator";
import { renderBeatToAudioBuffer } from "@/lib/beatgen/player";
import type { VocalTrack, StudioProject } from "@/lib/types";
import * as storageDb from "@/lib/storage/db";

function trackBlobKey(projectId: string, trackId: string) {
  return `track:${projectId}:${trackId}`;
}

export function useStudioEngine() {
  const state = useStudioStore();
  const [currentTime, setCurrentTime] = useState(0);
  const [isGeneratingBeat, setIsGeneratingBeat] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedProjects, setSavedProjects] = useState<StudioProject[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecorderHandle | null>(null);
  const recordingStartPosRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  const reportError = useCallback((prefix: string, e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    setError(`${prefix}: ${message}`);
  }, []);

  const play = useCallback(
    (fromTime?: number) => {
      getAudioContext();
      const startAt = fromTime ?? currentTime;
      const trackInputs = state.tracks
        .map((t) => ({
          id: t.id,
          buffer: state.trackBuffers[t.id],
          offset: t.offset,
          gain: t.gain,
          pan: t.pan,
          muted: t.muted,
          solo: t.solo,
        }))
        .filter((t) => !!t.buffer);

      playbackEngine.start({
        beatBuffer: state.beatBuffer,
        beatGain: state.beatGain,
        tracks: trackInputs,
        startAt,
        onTime: setCurrentTime,
        onEnded: () => state.setIsPlaying(false),
      });
      state.setIsPlaying(true);
    },
    [currentTime, state],
  );

  const stop = useCallback(() => {
    playbackEngine.stop();
    state.setIsPlaying(false);
  }, [state]);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) stop();
    else play();
  }, [state.isPlaying, play, stop]);

  const seek = useCallback(
    (t: number) => {
      const wasPlaying = state.isPlaying;
      if (wasPlaying) playbackEngine.stop();
      setCurrentTime(Math.max(0, t));
      if (wasPlaying) play(Math.max(0, t));
    },
    [state.isPlaying, play],
  );

  const startRecording = useCallback(async () => {
    try {
      getAudioContext();
      const startAt = currentTime;
      recordingStartPosRef.current = startAt;

      const trackInputs = state.tracks
        .map((t) => ({
          id: t.id,
          buffer: state.trackBuffers[t.id],
          offset: t.offset,
          gain: t.gain,
          pan: t.pan,
          muted: t.muted,
          solo: t.solo,
        }))
        .filter((t) => !!t.buffer);

      playbackEngine.start({
        beatBuffer: state.beatBuffer,
        beatGain: state.beatGain,
        tracks: trackInputs,
        startAt,
        onTime: setCurrentTime,
      });

      recorderRef.current = await startVocalRecording();
      state.setIsRecording(true);
      state.setIsPlaying(true);
    } catch (e) {
      reportError("Couldn't access the microphone", e);
    }
  }, [currentTime, state, reportError]);

  const stopRecording = useCallback(async () => {
    const handle = recorderRef.current;
    if (!handle) return;
    recorderRef.current = null;
    try {
      const blob = await handle.stop();
      playbackEngine.stop();
      state.setIsPlaying(false);
      state.setIsRecording(false);

      const buffer = await decodeAudioFile(blob);
      const track: VocalTrack = {
        id: crypto.randomUUID(),
        name: `Take ${state.tracks.length + 1}`,
        createdAt: Date.now(),
        duration: buffer.duration,
        gain: 1,
        pan: 0,
        muted: false,
        solo: false,
        reverbSend: 0.15,
        pitchCorrect: 0,
        offset: recordingStartPosRef.current,
      };
      state.addTrack(track, buffer);
    } catch (e) {
      reportError("Recording failed", e);
    }
  }, [state, reportError]);

  const cancelRecording = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    playbackEngine.stop();
    state.setIsRecording(false);
    state.setIsPlaying(false);
  }, [state]);

  const generateBeat = useCallback(
    async (options: GenerateBeatOptions) => {
      setIsGeneratingBeat(true);
      setError(null);
      try {
        const spec = createBeatSpec(options);
        const composition = composeBeat(spec);
        const buffer = await renderBeatToAudioBuffer(composition, 1);
        state.setBeat(spec, buffer, null);
      } catch (e) {
        reportError("Beat generation failed", e);
      } finally {
        setIsGeneratingBeat(false);
      }
    },
    [state, reportError],
  );

  const regenerateBeat = useCallback(async () => {
    if (!state.beatSpec) return;
    await generateBeat({
      genre: state.beatSpec.genre,
      bpm: state.beatSpec.bpm,
      key: state.beatSpec.key,
      scale: state.beatSpec.scale,
      bars: state.beatSpec.bars,
    });
  }, [state.beatSpec, generateBeat]);

  const uploadBeat = useCallback(
    async (file: File) => {
      setIsGeneratingBeat(true);
      setError(null);
      try {
        const buffer = await decodeAudioFile(file);
        const spec = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          genre: "pop" as const,
          bpm: 120,
          key: "C" as const,
          scale: "major" as const,
          bars: 0,
          seed: 0,
          createdAt: Date.now(),
          sourceAudio: { fileName: file.name },
        };
        const blobKey = `beat:${spec.id}`;
        await storageDb.saveBlob(blobKey, file);
        state.setBeat(spec, buffer, blobKey);
      } catch (e) {
        reportError("Couldn't load that audio file", e);
      } finally {
        setIsGeneratingBeat(false);
      }
    },
    [state, reportError],
  );

  const runMastering = useCallback(async () => {
    if (!state.beatBuffer && state.tracks.length === 0) {
      setError("Add a beat or record a vocal take before mastering.");
      return;
    }
    setIsMastering(true);
    setError(null);
    try {
      const mix = await renderMixdown({
        beatBuffer: state.beatBuffer,
        beatGain: state.beatGain,
        beatSpec: state.beatSpec,
        tracks: state.tracks
          .filter((t) => state.trackBuffers[t.id])
          .map((t) => ({ track: t, buffer: state.trackBuffers[t.id] })),
      });
      const result = await renderMasterChain(mix, state.mastering);
      state.setMasteredResult(result.buffer, {
        measuredLufsBefore: result.measuredLufsBefore,
        appliedGainDb: result.appliedGainDb,
        renderedAt: Date.now(),
      });
    } catch (e) {
      reportError("Mastering failed", e);
    } finally {
      setIsMastering(false);
    }
  }, [state, reportError]);

  const exportMastered = useCallback(() => {
    if (!state.masteredBuffer) return;
    const blob = audioBufferToWav(state.masteredBuffer);
    downloadBlob(blob, `${state.projectName.replace(/\s+/g, "-").toLowerCase()}-mastered.wav`);
  }, [state.masteredBuffer, state.projectName]);

  const exportRawMix = useCallback(async () => {
    try {
      const mix = await renderMixdown({
        beatBuffer: state.beatBuffer,
        beatGain: state.beatGain,
        beatSpec: state.beatSpec,
        tracks: state.tracks
          .filter((t) => state.trackBuffers[t.id])
          .map((t) => ({ track: t, buffer: state.trackBuffers[t.id] })),
      });
      const blob = audioBufferToWav(mix);
      downloadBlob(blob, `${state.projectName.replace(/\s+/g, "-").toLowerCase()}-raw-mix.wav`);
    } catch (e) {
      reportError("Export failed", e);
    }
  }, [state, reportError]);

  const persistProject = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const record = state.toProjectRecord();
      await Promise.all(
        state.tracks.map(async (t) => {
          const buffer = state.trackBuffers[t.id];
          if (!buffer) return;
          const blob = audioBufferToWav(buffer);
          await storageDb.saveBlob(trackBlobKey(record.id, t.id), blob);
        }),
      );
      await storageDb.saveProject(record);
    } catch (e) {
      reportError("Couldn't save project", e);
    } finally {
      setIsSaving(false);
    }
  }, [state, reportError]);

  const refreshSavedProjects = useCallback(async () => {
    try {
      const projects = await storageDb.listProjects();
      setSavedProjects(projects);
    } catch (e) {
      reportError("Couldn't list saved sessions", e);
    }
  }, [reportError]);

  const openProject = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const project = await storageDb.loadProject(id);
        if (!project) return;

        let beatBuffer: AudioBuffer | null = null;
        if (project.beat) {
          if (project.beat.sourceAudio && project.beatAudioKey) {
            const blob = await storageDb.loadBlob(project.beatAudioKey);
            if (blob) beatBuffer = await decodeAudioFile(blob);
          } else {
            const composition = composeBeat(project.beat);
            beatBuffer = await renderBeatToAudioBuffer(composition, 1);
          }
        }

        const trackBuffers: Record<string, AudioBuffer> = {};
        for (const track of project.tracks) {
          const blob = await storageDb.loadBlob(trackBlobKey(project.id, track.id));
          if (blob) trackBuffers[track.id] = await decodeAudioFile(blob);
        }

        state.hydrateFromProject(project, beatBuffer, trackBuffers);
        setCurrentTime(0);
      } catch (e) {
        reportError("Couldn't open that session", e);
      }
    },
    [state, reportError],
  );

  const deleteSavedProject = useCallback(
    async (id: string) => {
      try {
        await storageDb.deleteProject(id);
        await refreshSavedProjects();
      } catch (e) {
        reportError("Couldn't delete session", e);
      }
    },
    [refreshSavedProjects, reportError],
  );

  const removeTrack = useCallback(
    async (id: string) => {
      state.removeTrack(id);
      try {
        await storageDb.deleteBlob(trackBlobKey(state.projectId, id));
      } catch {
        // best-effort cleanup
      }
    },
    [state],
  );

  const newProject = useCallback(() => {
    stop();
    state.resetProject();
    setCurrentTime(0);
  }, [state, stop]);

  return {
    ...state,
    currentTime,
    isGeneratingBeat,
    isMastering,
    isSaving,
    savedProjects,
    error,
    clearError,
    play,
    stop,
    togglePlay,
    seek,
    startRecording,
    stopRecording,
    cancelRecording,
    generateBeat,
    regenerateBeat,
    uploadBeat,
    runMastering,
    exportMastered,
    exportRawMix,
    persistProject,
    refreshSavedProjects,
    openProject,
    deleteSavedProject,
    removeTrack,
    newProject,
  };
}
