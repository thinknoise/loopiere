// utils/audioUtils.ts

export function trimAudioBufferSilence(
  buffer: AudioBuffer,
  audioContext: AudioContext,
  threshold = 0.02,
  minSoundFrames = 10
): AudioBuffer {
  const { numberOfChannels, length, sampleRate } = buffer;
  const channelData = Array(numberOfChannels)
    .fill(0)
    .map((_, ch) => buffer.getChannelData(ch));

  // --- Find first sound index ---
  let firstSoundIndex = 0;
  let foundStart = false;
  for (let i = 0; i < length - minSoundFrames; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      let isSound = true;
      for (let k = 0; k < minSoundFrames; k++) {
        if (Math.abs(channelData[ch][i + k]) < threshold) {
          isSound = false;
          break;
        }
      }
      if (isSound) {
        firstSoundIndex = i;
        foundStart = true;
        break;
      }
    }
    if (foundStart) break;
  }

  // --- Find last sound index ---
  let lastSoundIndex = length - 1;
  let foundEnd = false;
  for (let i = length - minSoundFrames - 1; i > firstSoundIndex; i--) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      let isSound = true;
      for (let k = 0; k < minSoundFrames; k++) {
        if (Math.abs(channelData[ch][i - k]) < threshold) {
          isSound = false;
          break;
        }
      }
      if (isSound) {
        lastSoundIndex = i;
        foundEnd = true;
        break;
      }
    }
    if (foundEnd) break;
  }

  // If no significant sound found, return original buffer
  if (firstSoundIndex === 0 && lastSoundIndex === length - 1) return buffer;

  const trimmedLength = lastSoundIndex - firstSoundIndex + 1;
  const trimmedBuffer = audioContext.createBuffer(
    numberOfChannels,
    trimmedLength,
    sampleRate
  );

  for (let ch = 0; ch < numberOfChannels; ch++) {
    trimmedBuffer
      .getChannelData(ch)
      .set(channelData[ch].slice(firstSoundIndex, lastSoundIndex + 1));
  }

  return trimmedBuffer;
}
