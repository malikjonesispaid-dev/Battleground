/**
 * Downsamples an AudioBuffer into min/max peak pairs so the waveform can be
 * drawn cheaply on a canvas regardless of the source length.
 */
export function computePeaks(buffer: AudioBuffer, resolution: number): Float32Array {
  const channelCount = buffer.numberOfChannels;
  const length = buffer.length;
  const samplesPerBucket = Math.max(1, Math.floor(length / resolution));
  const peaks = new Float32Array(resolution * 2); // [min, max] per bucket

  const channelData: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  for (let bucket = 0; bucket < resolution; bucket++) {
    const start = bucket * samplesPerBucket;
    const end = Math.min(length, start + samplesPerBucket);
    let min = 0;
    let max = 0;
    for (let i = start; i < end; i++) {
      for (let c = 0; c < channelCount; c++) {
        const v = channelData[c][i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    peaks[bucket * 2] = min;
    peaks[bucket * 2 + 1] = max;
  }

  return peaks;
}
