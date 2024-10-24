import { useState, useRef, useCallback } from 'react';
import { getAudioContext } from '../utils/audioManager';

// Custom hook for handling audio playback with recursive timer
const useAudioPlaybackWithTimer = () => {
  const [playingSources, setPlayingSources] = useState([]); // To store active audio sources
  const isPlayingRef = useRef(false); // Ref to track if playback is active
  const startTimeRef = useRef(0); // Ref to store the start time of the loop
  const allSamplesRef = useRef([]); // Ref to keep the latest version of allSamples
  const loopTempoRef = useRef(0); // Ref to keep track of the tempo

  // Memoize the updateSequence function using useCallback
  const updateSequence = useCallback((allSamples, secsPerMeasure) => {
    // Update the refs to keep the latest allSamples and tempo
    allSamplesRef.current = allSamples;
    loopTempoRef.current = secsPerMeasure;
  }, []); 

  // Function to play the audio set
  const playAudioSet = (allSamples, secsPerMeasure) => {
    // Assuming each sample has an audioBuffer property
    // fix this - wiley
    const audioBuffers = allSamplesRef.current.map(sample => sample.audioBuffer); 
    const offsets = allSamplesRef.current.map(sample => sample.xPos); // Use xPos as offset time

    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext();
    const sources = [];

    console.log(secsPerMeasure)
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

    // Start the recursive timer after secsPerMeasure seconds
    startTimeRef.current = context.currentTime;
    scheduleNextPlayback(allSamplesRef.current); // Ensure the latest samples are used for next playback loop
  };

  // Looping function to schedule the next playback
  const scheduleNextPlayback = (allSamples) => {
    const context = getAudioContext();
    const loop = () => {
      const elapsed = context.currentTime - startTimeRef.current;

      if (elapsed >= loopTempoRef.current) {
        // Stop the current playback
        handleStopAllSamples();
        // Restart the playback loop by calling playAudioSet again using the updated allSamples
        playAudioSet(allSamplesRef.current, loopTempoRef.current); // Play using the latest allSamples from ref

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

  return { playAudioSet, handleStopAllSamples, updateSequence };
};

export default useAudioPlaybackWithTimer;
