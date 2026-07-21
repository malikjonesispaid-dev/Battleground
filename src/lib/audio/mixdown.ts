import type { BeatSpec, VocalTrack } from "@/lib/types";
import { applyPitchCorrection } from "./pitchCorrect";
import { buildVoiceEffectChain, getPlaybackRateForEffect } from "./voiceEffects";

export interface MixTrackInput {
  track: VocalTrack;
  buffer: AudioBuffer;
}

function getOfflineCtor(): typeof OfflineAudioContext {
  return (window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext) as typeof OfflineAudioContext;
}

/** Builds a small synthetic impulse response for a plate-style reverb send. */
function buildReverbImpulse(ctx: BaseAudioContext, seconds = 2.2, decay = 3.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

export interface MixdownOptions {
  beatBuffer: AudioBuffer | null;
  beatGain: number;
  beatSpec: BeatSpec | null;
  tracks: MixTrackInput[];
  /** Extra tail time in seconds appended for reverb decay. */
  tailSeconds?: number;
}

/**
 * Renders the beat plus all vocal tracks (with per-track gain/pan/mute/solo,
 * reverb send, and optional pitch correction) down to a single stereo
 * AudioBuffer, ready for the mastering chain or direct export.
 */
export async function renderMixdown(options: MixdownOptions): Promise<AudioBuffer> {
  const { beatBuffer, beatGain, beatSpec, tracks, tailSeconds = 1.5 } = options;
  const sampleRate = beatBuffer?.sampleRate ?? tracks[0]?.buffer.sampleRate ?? 44100;

  const trackEnds = tracks.map((t) => t.track.offset + t.buffer.duration);
  const beatEnd = beatBuffer ? beatBuffer.duration : 0;
  const totalDuration = Math.max(beatEnd, ...trackEnds, 1) + tailSeconds;
  const length = Math.ceil(totalDuration * sampleRate);

  const OfflineCtor = getOfflineCtor();
  const ctx = new OfflineCtor(2, length, sampleRate);

  const master = ctx.createGain();
  master.connect(ctx.destination);

  const reverbBus = ctx.createConvolver();
  reverbBus.buffer = buildReverbImpulse(ctx);
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.9;
  reverbBus.connect(reverbReturn);
  reverbReturn.connect(master);

  if (beatBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = beatBuffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = beatGain;
    source.connect(gainNode).connect(master);
    source.start(0);
  }

  const anySolo = tracks.some((t) => t.track.solo);

  for (const { track, buffer } of tracks) {
    if (track.muted) continue;
    if (anySolo && !track.solo) continue;

    let audioBuffer = buffer;
    if (track.pitchCorrect > 0 && beatSpec) {
      const processed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const corrected = applyPitchCorrection(
          buffer.getChannelData(c),
          buffer.sampleRate,
          beatSpec.key,
          beatSpec.scale,
          track.pitchCorrect,
        );
        processed.copyToChannel(corrected as Float32Array<ArrayBuffer>, c);
      }
      audioBuffer = processed;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = getPlaybackRateForEffect(track.voiceEffect);

    const effectChain = buildVoiceEffectChain(ctx, track.voiceEffect);

    const gainNode = ctx.createGain();
    gainNode.gain.value = track.gain;

    const panNode = ctx.createStereoPanner();
    panNode.pan.value = track.pan;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1;
    const sendGain = ctx.createGain();
    sendGain.gain.value = track.reverbSend;

    source.connect(effectChain.input);
    effectChain.output.connect(gainNode).connect(panNode);
    panNode.connect(dryGain).connect(master);
    panNode.connect(sendGain).connect(reverbBus);

    source.start(track.offset);
  }

  return ctx.startRendering();
}
