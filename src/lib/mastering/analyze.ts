/**
 * Estimates integrated loudness in LUFS-ish units using a simplified
 * K-weighting approximation (high-pass + presence shelf, per the spirit of
 * ITU-R BS.1770) followed by mean-square power measurement. This is a
 * practical approximation for auto-gain purposes, not a certified loudness
 * meter.
 */
export async function estimateLoudness(buffer: AudioBuffer): Promise<number> {
  const OfflineCtor = (window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext) as typeof OfflineAudioContext;

  const ctx = new OfflineCtor(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const highPass = ctx.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 80;

  const presenceShelf = ctx.createBiquadFilter();
  presenceShelf.type = "highshelf";
  presenceShelf.frequency.value = 2000;
  presenceShelf.gain.value = 4;

  source.connect(highPass).connect(presenceShelf).connect(ctx.destination);
  source.start();

  const rendered = await ctx.startRendering();

  let sumSquares = 0;
  let count = 0;
  for (let c = 0; c < rendered.numberOfChannels; c++) {
    const data = rendered.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      sumSquares += data[i] * data[i];
      count++;
    }
  }
  const meanSquare = count > 0 ? sumSquares / count : 0;
  const dbfs = 10 * Math.log10(meanSquare + 1e-12);
  return dbfs - 0.691;
}

export function truePeakDb(buffer: AudioBuffer): number {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  return 20 * Math.log10(peak + 1e-12);
}
