"use client";

import { useStudioEngine } from "@/hooks/useStudioEngine";
import { ProjectBar } from "@/components/studio/ProjectBar";
import { Transport } from "@/components/studio/Transport";
import { BeatLibrary } from "@/components/studio/BeatLibrary";
import { TrackList } from "@/components/studio/TrackList";
import { LyricsTeleprompter } from "@/components/studio/LyricsTeleprompter";
import { MasteringPanel } from "@/components/studio/MasteringPanel";
import { Button } from "@/components/ui/Button";
import { Download, X } from "lucide-react";
import { playbackEngine } from "@/lib/audio/livePlayback";
import { useCallback } from "react";

export default function StudioPage() {
  const engine = useStudioEngine();

  const lyricsText = engine.lyrics.map((l) => l.text).join("\n");

  const previewMastered = useCallback(() => {
    if (!engine.masteredBuffer) return;
    playbackEngine.start({
      beatBuffer: engine.masteredBuffer,
      beatGain: 1,
      tracks: [],
      startAt: 0,
    });
  }, [engine.masteredBuffer]);

  const totalDuration = Math.max(
    engine.beatBuffer?.duration ?? 0,
    ...engine.tracks.map((t) => t.offset + (engine.trackBuffers[t.id]?.duration ?? 0)),
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <ProjectBar
        projectName={engine.projectName}
        onRename={engine.setProjectName}
        isSaving={engine.isSaving}
        onSave={engine.persistProject}
        onNew={engine.newProject}
        savedProjects={engine.savedProjects}
        onRefreshList={engine.refreshSavedProjects}
        onOpen={engine.openProject}
        onDelete={engine.deleteSavedProject}
      />

      {engine.error && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:mx-6">
          {engine.error}
          <button onClick={engine.clearError} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <Transport
          isPlaying={engine.isPlaying}
          isRecording={engine.isRecording}
          currentTime={engine.currentTime}
          hasContent={!!engine.beatBuffer || engine.tracks.length > 0}
          onTogglePlay={engine.togglePlay}
          onRecord={engine.startRecording}
          onStopRecording={engine.stopRecording}
          onRewind={() => engine.seek(0)}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BeatLibrary
            beatSpec={engine.beatSpec}
            beatBuffer={engine.beatBuffer}
            beatGain={engine.beatGain}
            isGenerating={engine.isGeneratingBeat}
            recentBeats={engine.recentBeats}
            onGenerate={(genre, key, bars) => engine.generateBeat({ genre, key, bars })}
            onRegenerate={engine.regenerateBeat}
            onUpload={engine.uploadBeat}
            onSetBeatGain={engine.setBeatGain}
            onRestoreRecent={engine.restoreRecentBeat}
          />

          <LyricsTeleprompter
            lyricsText={lyricsText}
            onChangeText={engine.setLyricsFromText}
            isPlaying={engine.isPlaying}
            currentTime={engine.currentTime}
            totalDuration={totalDuration}
          />
        </div>

        <TrackList
          tracks={engine.tracks}
          trackBuffers={engine.trackBuffers}
          activeTrackId={engine.activeTrackId}
          currentTime={engine.currentTime}
          isPlaying={engine.isPlaying}
          onUpdate={engine.updateTrack}
          onRemove={engine.removeTrack}
          onSelect={engine.setActiveTrackId}
        />

        <MasteringPanel
          mastering={engine.mastering}
          isMastering={engine.isMastering}
          masteredMeta={engine.masteredMeta}
          hasMasteredBuffer={!!engine.masteredBuffer}
          onPresetChange={engine.setMasteringPreset}
          onSettingChange={engine.setMastering}
          onMaster={engine.runMastering}
          onExport={engine.exportMastered}
          onPreview={previewMastered}
        />

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={engine.exportRawMix}>
            <Download size={14} /> Export unmastered mix
          </Button>
        </div>
      </main>
    </div>
  );
}
