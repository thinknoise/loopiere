import { useState, useRef } from 'react';
import { getAudioContext } from '../utils/audioManager';

// Custom hook for handling audio playback with recursive timer
const useAudioPlaybackWithTimer = () => {
  const [playingSources, setPlayingSources] = useState([]); // To store active audio sources
  const isPlayingRef = useRef(false); // Ref to track if playback is active
  const startTimeRef = useRef(0); // Ref to store the start time of the loop


  // Function to play the audio set
  const playAudioSet = (allSamples, measurePerSecond) => {
    // Stop the current playback (redundent? for interrumptions?)
    handleStopAllSamples();

    const audioBuffers = allSamples.map(sample => sample.audioBuffer); // Assuming each sample has an audioBuffer property
    const offsets = allSamples.map(sample => sample.xPos); // Use xPos as offset time

    console.log('allSamples', allSamples, 'measurePerSecond', measurePerSecond)

    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext();
    const sources = [];

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = buffer;
      const offsetTime = offsets[index] * measurePerSecond || 0;
      source.start(context.currentTime + offsetTime, 0);
      sources.push(source);
    });

    // Store the sources and set playing state
    setPlayingSources(sources);
    isPlayingRef.current = true;

    // Start the recursive timer after measurePerSecond seconds - set in TrackList
    startTimeRef.current = context.currentTime;
    scheduleNextPlayback(allSamples, measurePerSecond);
  };

  ///
  // looping function to schedule the next playback
  const scheduleNextPlayback = (allSamples, measurePerSecond) => {
    const context = getAudioContext();
    const loop = () => {
      const elapsed = context.currentTime - startTimeRef.current;

      if (elapsed >= measurePerSecond) {
        // Stop the current playback
        handleStopAllSamples();
        // Restart the playback loop by calling playAudioSet again
        playAudioSet(allSamples, measurePerSecond);

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
