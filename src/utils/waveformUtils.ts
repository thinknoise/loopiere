// src/utils/waveformUtils.ts

/**
 * Compute a simplified waveform array from an AudioBuffer.
 *
 * @param audioBuffer - The decoded AudioBuffer to sample.
 * @param sampleCount - Number of samples to produce (default 500).
 * @returns An array of normalized amplitude values (0–1) of length `sampleCount`.
 */
export function getWaveformData(
  audioBuffer: AudioBuffer,
  sampleCount = 500
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const waveform: number[] = new Array(sampleCount).fill(0).map((_, i) => {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    return sum / blockSize;
  });
  return waveform;
}
