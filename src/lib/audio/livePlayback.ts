import { getAudioContext } from "./context";
import { buildVoiceEffectChain, getPlaybackRateForEffect } from "./voiceEffects";
import type { VoiceEffectId } from "@/lib/types";

export interface PlaybackTrackInput {
  id: string;
  buffer: AudioBuffer;
  offset: number;
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  voiceEffect?: VoiceEffectId;
}

export interface PlaybackInput {
  beatBuffer: AudioBuffer | null;
  beatGain: number;
  tracks: PlaybackTrackInput[];
  startAt: number;
  onTime?: (t: number) => void;
  onEnded?: () => void;
}

/**
 * Schedules the beat and all vocal tracks as live AudioBufferSourceNodes
 * so the user can hear everything together during playback/recording.
 * Not used for the final render - see mixdown.ts + mastering/chain.ts for
 * the offline (higher quality, non-realtime) path.
 */
class PlaybackEngine {
  private activeNodes: AudioScheduledSourceNode[] = [];
  private startedAtCtxTime = 0;
  private startedAtTimelinePos = 0;
  private playing = false;
  private rafId: number | null = null;
  private endTimeout: number | null = null;

  start(input: PlaybackInput) {
    this.stop();
    const ctx = getAudioContext();
    const now = ctx.currentTime + 0.05;
    this.startedAtCtxTime = now;
    this.startedAtTimelinePos = input.startAt;
    this.playing = true;

    const anySolo = input.tracks.some((t) => t.solo);

    if (input.beatBuffer && input.startAt < input.beatBuffer.duration) {
      const source = ctx.createBufferSource();
      source.buffer = input.beatBuffer;
      const gain = ctx.createGain();
      gain.gain.value = input.beatGain;
      source.connect(gain).connect(ctx.destination);
      source.start(now, Math.max(0, input.startAt));
      this.activeNodes.push(source);
    }

    for (const track of input.tracks) {
      if (track.muted) continue;
      if (anySolo && !track.solo) continue;

      const relativeStart = track.offset - input.startAt;
      if (relativeStart < 0 && -relativeStart >= track.buffer.duration) continue;

      const effect = track.voiceEffect ?? "none";
      const source = ctx.createBufferSource();
      source.buffer = track.buffer;
      source.playbackRate.value = getPlaybackRateForEffect(effect);
      const gain = ctx.createGain();
      gain.gain.value = track.gain;
      const pan = ctx.createStereoPanner();
      pan.pan.value = track.pan;
      const effectChain = buildVoiceEffectChain(ctx, effect);
      source.connect(effectChain.input);
      effectChain.output.connect(gain).connect(pan).connect(ctx.destination);

      if (relativeStart >= 0) {
        source.start(now + relativeStart);
      } else {
        source.start(now, -relativeStart);
      }
      this.activeNodes.push(source);
    }

    const maxRemaining = Math.max(
      0,
      input.beatBuffer ? input.beatBuffer.duration - input.startAt : 0,
      ...input.tracks.map((t) => t.offset + t.buffer.duration - input.startAt),
    );

    const tick = () => {
      if (!this.playing) return;
      const elapsed = ctx.currentTime - this.startedAtCtxTime;
      input.onTime?.(this.startedAtTimelinePos + Math.max(0, elapsed));
      this.rafId = requestAnimationFrame(tick);
    };
    tick();

    if (maxRemaining > 0) {
      this.endTimeout = window.setTimeout(() => {
        if (this.playing) {
          this.stop();
          input.onEnded?.();
        }
      }, maxRemaining * 1000 + 150);
    }
  }

  stop() {
    this.playing = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.endTimeout !== null) window.clearTimeout(this.endTimeout);
    this.rafId = null;
    this.endTimeout = null;
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    this.activeNodes = [];
  }

  isPlaying() {
    return this.playing;
  }
}

export const playbackEngine = new PlaybackEngine();
