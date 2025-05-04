// src/utils/waveformUtils.js

export function getWaveformData(audioBuffer, sampleCount = 500) {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const waveform = new Array(sampleCount).fill(0).map((_, i) => {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    for (let j = start; j < end && j < channelData.length; j++) {
      sum += Math.abs(channelData[j]);
    }
    return sum / blockSize;
  });
  return waveform;
}
