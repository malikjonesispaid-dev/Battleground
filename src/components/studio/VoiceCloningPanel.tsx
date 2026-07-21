"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { audioBufferToWav } from "@/lib/audio/wav";
import { decodeAudioFile } from "@/lib/audio/context";
import { getStoredApiKey, setStoredApiKey } from "@/lib/voiceClone/apiKeyStore";
import { cloneVoice, convertToVoice, listVoices, type ClonedVoice } from "@/lib/voiceClone/elevenlabs";
import type { VocalTrack } from "@/lib/types";
import { Wand2, RefreshCw, Mic } from "lucide-react";

export function VoiceCloningPanel({
  tracks,
  trackBuffers,
  activeTrackId,
  onAddTrack,
}: {
  tracks: VocalTrack[];
  trackBuffers: Record<string, AudioBuffer>;
  activeTrackId: string | null;
  onAddTrack: (track: VocalTrack, buffer: AudioBuffer) => boolean;
}) {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vocalTracks = tracks.filter((t) => t.kind === "vocal");
  const [cloneName, setCloneName] = useState("My Voice");
  const [cloneSourceIdOverride, setCloneSourceIdOverride] = useState<string | null>(null);
  const [convertSourceIdOverride, setConvertSourceIdOverride] = useState<string | null>(null);
  const [convertVoiceId, setConvertVoiceId] = useState<string>("");

  // Derived defaults (rather than synced-via-effect state) so the dropdowns
  // track newly recorded takes without a stale selection lingering.
  const cloneSourceId = cloneSourceIdOverride ?? vocalTracks[0]?.id ?? "";
  const convertSourceId = convertSourceIdOverride ?? activeTrackId ?? vocalTracks[0]?.id ?? "";

  const saveApiKey = (value: string) => {
    setApiKey(value);
    setStoredApiKey(value);
  };

  const refreshVoices = async () => {
    if (!apiKey) {
      setError("Enter your ElevenLabs API key first.");
      return;
    }
    setBusy("refresh");
    setError(null);
    try {
      const list = await listVoices(apiKey);
      setVoices(list);
      setVoicesLoaded(true);
      if (!convertVoiceId && list.length > 0) setConvertVoiceId(list[0].voiceId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleClone = async () => {
    if (!apiKey) {
      setError("Enter your ElevenLabs API key first.");
      return;
    }
    const sourceBuffer = trackBuffers[cloneSourceId];
    if (!sourceBuffer) {
      setError("Pick a recorded vocal take to use as the voice sample.");
      return;
    }
    setBusy("clone");
    setError(null);
    try {
      const wav = audioBufferToWav(sourceBuffer);
      const voice = await cloneVoice(apiKey, cloneName || "My Voice", wav);
      setVoices((prev) => [voice, ...prev]);
      setVoicesLoaded(true);
      setConvertVoiceId(voice.voiceId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleConvert = async () => {
    if (!apiKey) {
      setError("Enter your ElevenLabs API key first.");
      return;
    }
    const sourceTrack = tracks.find((t) => t.id === convertSourceId);
    const sourceBuffer = trackBuffers[convertSourceId];
    const voice = voices.find((v) => v.voiceId === convertVoiceId);
    if (!sourceTrack || !sourceBuffer || !voice) {
      setError("Pick a track and a voice to convert to.");
      return;
    }
    setBusy("convert");
    setError(null);
    try {
      const wav = audioBufferToWav(sourceBuffer);
      const resultBlob = await convertToVoice(apiKey, voice.voiceId, wav);
      const buffer = await decodeAudioFile(resultBlob);
      const track: VocalTrack = {
        id: crypto.randomUUID(),
        name: `${sourceTrack.name} → ${voice.name}`,
        createdAt: Date.now(),
        duration: buffer.duration,
        gain: 1,
        pan: 0,
        muted: false,
        solo: false,
        reverbSend: sourceTrack.reverbSend,
        pitchCorrect: 0,
        offset: sourceTrack.offset,
        kind: "vocal",
        voiceEffect: "none",
      };
      onAddTrack(track, buffer);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border-t border-neutral-800 pt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-200">
        <Wand2 size={15} className="text-fuchsia-400" />
        Voice Cloning <span className="text-xs font-normal text-neutral-500">(ElevenLabs, your API key)</span>
      </div>

      <label className="mb-3 flex flex-col gap-1 text-xs text-neutral-400">
        ElevenLabs API key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => saveApiKey(e.target.value)}
          placeholder="sk_..."
          className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none"
        />
        <span className="text-[11px] text-neutral-600">
          Stored only in this browser and sent directly to ElevenLabs. Usage is billed to your ElevenLabs account.
        </span>
      </label>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-300">Clone a voice from a take</p>
          <div className="flex flex-col gap-2">
            <input
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="Voice name"
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100 outline-none"
            />
            <select
              value={cloneSourceId}
              onChange={(e) => setCloneSourceIdOverride(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
            >
              {vocalTracks.length === 0 && <option value="">Record a vocal take first</option>}
              {vocalTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={handleClone} disabled={busy !== null || vocalTracks.length === 0}>
              <Mic size={13} /> {busy === "clone" ? "Cloning…" : "Clone Voice"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-300">Convert a take to a voice</p>
            <button
              onClick={refreshVoices}
              disabled={busy !== null}
              className="text-neutral-500 hover:text-neutral-300"
              aria-label="Refresh voices"
            >
              <RefreshCw size={13} className={busy === "refresh" ? "animate-spin" : undefined} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <select
              value={convertSourceId}
              onChange={(e) => setConvertSourceIdOverride(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
            >
              {vocalTracks.length === 0 && <option value="">Record a vocal take first</option>}
              {vocalTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={convertVoiceId}
              onChange={(e) => setConvertVoiceId(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
            >
              {!voicesLoaded && <option value="">Refresh to load your voices</option>}
              {voicesLoaded && voices.length === 0 && <option value="">No voices yet - clone one first</option>}
              {voices.map((v) => (
                <option key={v.voiceId} value={v.voiceId}>
                  {v.name}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConvert}
              disabled={busy !== null || vocalTracks.length === 0 || voices.length === 0}
            >
              <Wand2 size={13} /> {busy === "convert" ? "Converting…" : "Convert"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
