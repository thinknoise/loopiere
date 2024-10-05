import { useState } from 'react';
import { getAudioContext } from '../utils/audioManager';

// Custom hook for handling audio playback
const useAudioPlayback = () => {
  const [playingSources, setPlayingSources] = useState([]); // To store active audio sources

  const playAudioSet = (audioBuffers, offsets, measurePerSecond) => {
    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext(); // Shared AudioContext
    const sources = []; // Temporary array to store the sources

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = buffer;
      const offsetTime = offsets[index] * measurePerSecond || 0; // Offset for each sample
      source.start(context.currentTime + offsetTime, 0); // Start with time offset

      // Store the source for later use (e.g., stopping)
      sources.push(source);
    });

    // Set the sources in the state
    setPlayingSources(sources);
  };

  const handlePlayAllSamples = (allSamples, measurePerSecond) => {
    const audioBuffers = allSamples.map(sample => sample.audioBuffer); // Assuming each sample has an audioBuffer property
    const offsets = allSamples.map(sample => sample.xPos); // Use xPos as offset time
    playAudioSet(audioBuffers, offsets, measurePerSecond);
  };

  const handleStopAllSamples = () => {
    playingSources.forEach((source) => {
      source.stop(); // Stop each source
    });

    // Clear the stored sources after stopping them
    setPlayingSources([]);
  };

  return { handlePlayAllSamples, handleStopAllSamples };
};

export default useAudioPlayback;
