import type { MasteringSettings } from "@/lib/types";
import { estimateLoudness } from "./analyze";

function getOfflineCtor(): typeof OfflineAudioContext {
  return (window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext) as typeof OfflineAudioContext;
}

function makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 4096;
  const curve = new Float32Array(n);
  const k = 1 + amount * 8;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/**
 * Builds the tone-shaping portion of the mastering chain (EQ, saturation,
 * dual-band compression, stereo width) without the final loudness gain or
 * limiter, so it can be reused for both the analysis pass and the real
 * render pass.
 */
function buildToneChain(ctx: BaseAudioContext, settings: MasteringSettings): { input: AudioNode; output: AudioNode } {
  const input = ctx.createGain();

  const subCut = ctx.createBiquadFilter();
  subCut.type = "highpass";
  subCut.frequency.value = 30;

  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 120;
  lowShelf.gain.value = settings.bassBoost;

  const presencePeak = ctx.createBiquadFilter();
  presencePeak.type = "peaking";
  presencePeak.frequency.value = 3200;
  presencePeak.Q.value = 0.9;
  presencePeak.gain.value = settings.presenceBoost;

  const airShelf = ctx.createBiquadFilter();
  airShelf.type = "highshelf";
  airShelf.frequency.value = 9500;
  airShelf.gain.value = settings.airBoost;

  input.connect(subCut).connect(lowShelf).connect(presencePeak).connect(airShelf);

  // --- Saturation (warmth): parallel dry/wet blend through a waveshaper ---
  const saturationDry = ctx.createGain();
  saturationDry.gain.value = 1 - settings.warmth * 0.6;
  const saturationWet = ctx.createGain();
  saturationWet.gain.value = settings.warmth;
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeSaturationCurve(settings.warmth);
  shaper.oversample = "4x";

  airShelf.connect(saturationDry);
  airShelf.connect(shaper);
  shaper.connect(saturationWet);

  const postSaturation = ctx.createGain();
  saturationDry.connect(postSaturation);
  saturationWet.connect(postSaturation);

  // --- Dual-band "glue" compression: bass stays punchy, top end gets smoothed ---
  const crossover = 150;
  const lowBand = ctx.createBiquadFilter();
  lowBand.type = "lowpass";
  lowBand.frequency.value = crossover;
  const highBand = ctx.createBiquadFilter();
  highBand.type = "highpass";
  highBand.frequency.value = crossover;

  postSaturation.connect(lowBand);
  postSaturation.connect(highBand);

  const lowComp = ctx.createDynamicsCompressor();
  lowComp.threshold.value = -18;
  lowComp.knee.value = 6;
  lowComp.ratio.value = 2 + settings.compressionAmount * 2;
  lowComp.attack.value = 0.02;
  lowComp.release.value = 0.25;

  const highComp = ctx.createDynamicsCompressor();
  highComp.threshold.value = -22;
  highComp.knee.value = 8;
  highComp.ratio.value = 2 + settings.compressionAmount * 4;
  highComp.attack.value = 0.004;
  highComp.release.value = 0.15;

  lowBand.connect(lowComp);
  highBand.connect(highComp);

  const compressedSum = ctx.createGain();
  const dryBypass = ctx.createGain();
  dryBypass.gain.value = 1 - settings.compressionAmount;
  const wetSum = ctx.createGain();
  wetSum.gain.value = settings.compressionAmount;

  postSaturation.connect(dryBypass);
  lowComp.connect(wetSum);
  highComp.connect(wetSum);

  dryBypass.connect(compressedSum);
  wetSum.connect(compressedSum);

  // --- Stereo width: keep bass mono, widen the rest via a short delay spread ---
  const widthLowSplit = ctx.createBiquadFilter();
  widthLowSplit.type = "lowpass";
  widthLowSplit.frequency.value = 150;
  const widthHighSplit = ctx.createBiquadFilter();
  widthHighSplit.type = "highpass";
  widthHighSplit.frequency.value = 150;

  compressedSum.connect(widthLowSplit);
  compressedSum.connect(widthHighSplit);

  const clampedWidth = Math.max(0, Math.min(2, settings.stereoWidth));
  const delay = ctx.createDelay(0.05);
  delay.delayTime.value = 0.011;
  const delayGain = ctx.createGain();
  delayGain.gain.value = clampedWidth * 0.5;
  const panA = ctx.createStereoPanner();
  panA.pan.value = -0.2 * Math.min(1, clampedWidth);
  const panB = ctx.createStereoPanner();
  panB.pan.value = 0.2 * Math.min(1, clampedWidth) + 0.25 * Math.max(0, clampedWidth - 1);

  widthHighSplit.connect(panA);
  widthHighSplit.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(panB);

  const output = ctx.createGain();
  widthLowSplit.connect(output);
  panA.connect(output);
  panB.connect(output);

  return { input, output };
}

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export interface MasterRenderResult {
  buffer: AudioBuffer;
  measuredLufsBefore: number;
  appliedGainDb: number;
}

/**
 * Runs the full "AI mastering" pipeline: renders the tone-shaping chain
 * once to measure loudness, computes the gain needed to hit the target
 * LUFS, then re-renders with makeup gain and a limiter applied.
 */
export async function renderMaster(
  inputBuffer: AudioBuffer,
  settings: MasteringSettings,
): Promise<MasterRenderResult> {
  const OfflineCtor = getOfflineCtor();
  const channels = 2;

  // Pass 1: tone-shaped signal, unity gain, no limiter - for loudness analysis.
  const analysisCtx = new OfflineCtor(channels, inputBuffer.length, inputBuffer.sampleRate);
  const analysisSource = analysisCtx.createBufferSource();
  analysisSource.buffer = inputBuffer;
  const analysisChain = buildToneChain(analysisCtx, settings);
  analysisSource.connect(analysisChain.input);
  analysisChain.output.connect(analysisCtx.destination);
  analysisSource.start();
  const analysisBuffer = await analysisCtx.startRendering();
  const measuredLufsBefore = await estimateLoudness(analysisBuffer);

  const rawGainDb = settings.targetLufs - measuredLufsBefore;
  const appliedGainDb = Math.max(-12, Math.min(18, rawGainDb));

  // Pass 2: same tone chain + makeup gain + limiter.
  const finalLength = inputBuffer.length + Math.ceil(inputBuffer.sampleRate * 0.3);
  const finalCtx = new OfflineCtor(channels, finalLength, inputBuffer.sampleRate);
  const finalSource = finalCtx.createBufferSource();
  finalSource.buffer = inputBuffer;
  const finalChain = buildToneChain(finalCtx, settings);

  const makeupGain = finalCtx.createGain();
  makeupGain.gain.value = dbToGain(appliedGainDb);

  const limiterShaper = finalCtx.createWaveShaper();
  const ceilingLinear = dbToGain(settings.limiterCeiling);
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 1.5) * ceilingLinear;
  }
  limiterShaper.curve = curve;
  limiterShaper.oversample = "4x";

  const brickwall = finalCtx.createDynamicsCompressor();
  brickwall.threshold.value = settings.limiterCeiling - 1;
  brickwall.knee.value = 0;
  brickwall.ratio.value = 20;
  brickwall.attack.value = 0.001;
  brickwall.release.value = 0.08;

  finalSource.connect(finalChain.input);
  finalChain.output.connect(makeupGain);
  makeupGain.connect(brickwall);
  brickwall.connect(limiterShaper);
  limiterShaper.connect(finalCtx.destination);
  finalSource.start();

  const buffer = await finalCtx.startRendering();
  return { buffer, measuredLufsBefore, appliedGainDb };
}
