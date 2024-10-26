import { useState, useRef } from 'react';
import { getAudioContext } from '../utils/audioManager';
import { loadAudio } from '../utils/audioManager'; // Import the utility

// Custom hook for handling audio playback with recursive timer
const useAudioPlaybackWithTimer = () => {
  const [playingSources, setPlayingSources] = useState([]); // To store active audio sources
  const isPlayingRef = useRef(false); // Ref to track if playback is active
  const startTimeRef = useRef(0); // Ref to store the start time of the loop


  const playAudioSet = async (latestSamplesRef, latestBpm) => {
    const secsPerMeasure = (60 / latestBpm.current) * 4;

    const audioBuffers = await Promise.all (latestSamplesRef.current.map(async sample => {
      console.log('playAudioSet', !sample.audioBuffer.duration)
      if (!sample.audioBuffer.duration) {
        const fullPath = `/samples/${sample.path}`;
        return await loadAudio(fullPath);
      }
      return sample.audioBuffer
    })); 

    
    const offsets = latestSamplesRef.current.map(sample => sample.xPos); // Use xPos as offset time

    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext();
    const sources = [];
    console.log('audioBuffers', audioBuffers)

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = buffer;
      const offsetTime = offsets[index] * secsPerMeasure || 0;
      source.start(context.currentTime + offsetTime, 0);
      sources.push(source);
    });

    // Store the sources and set playing state
    setPlayingSources(sources);
    isPlayingRef.current = true;

    startTimeRef.current = context.currentTime;

    scheduleNextPlayback(latestSamplesRef, latestBpm); // Ensure the latest samples are used for next playback loop
  };

  // Looping function to schedule the next playback
  const scheduleNextPlayback = (latestSamplesRef, latestBpm) => {
    const context = getAudioContext();
    const loop = () => {
      const elapsed = context.currentTime - startTimeRef.current;

      const secsPerMeasure = (60 / latestBpm.current) * 4;

      if (elapsed >= secsPerMeasure) {
        // Stop the current playback
        handleStopAllSamples();
        // Restart the playback loop by calling 
        playAudioSet(latestSamplesRef, latestBpm); 

        // Reset the start time for the next loop
        startTimeRef.current = context.currentTime;
      }

      // Continue the loop if still playing
      if (isPlayingRef.current) {
        requestAnimationFrame(loop); // Use requestAnimationFrame for smooth timing
      }
    };

    // Start the loop
    requestAnimationFrame(loop);
  };

  const handleStopAllSamples = () => {
    // Stop all currently playing sources
    playingSources.forEach((source) => {
      source.stop();
    });

    // Clear the stored sources after stopping them
    setPlayingSources([]);
    isPlayingRef.current = false;
  };

  return { playAudioSet, handleStopAllSamples };
};

export default useAudioPlaybackWithTimer;
