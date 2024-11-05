import { useState, useRef, useEffect, useCallback } from 'react';
import { getAudioContext } from '../utils/audioManager';
import { loadAudio } from '../utils/audioManager';
import { useSequenceContext } from '../contexts/SequenceContext';

const useAudioPlaybackWithTimer = () => {
  const { allSamples, bpm } = useSequenceContext(); // Access the latest allSamples and bpm
  const [playingSources, setPlayingSources] = useState([]);
  const isPlayingRef = useRef(false);
  const startTimeRef = useRef(0);

  useEffect(() => {
    console.log("Updated allSamples:", allSamples);
    console.log("Updated bpm:", bpm);
  }, [allSamples, bpm]);

  const playAudioSet = useCallback(async () => {
    const secsPerMeasure = (60 / bpm) * 4;
    console.log('---', allSamples, bpm);

    const audioBuffers = await Promise.all(allSamples.map(async sample => {
      if (!sample.audioBuffer?.duration) {
        const fullPath = `/samples/${sample.path}`;
        return await loadAudio(fullPath);
      }
      return sample.audioBuffer;
    }));

    const offsets = allSamples.map(sample => sample.xPos);

    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext();
    const sources = [];

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = buffer;
      const offsetTime = offsets[index] * secsPerMeasure || 0;
      source.start(context.currentTime + offsetTime, 0);
      sources.push(source);
    });

    setPlayingSources(sources);
    isPlayingRef.current = true;
    startTimeRef.current = context.currentTime;

    scheduleNextPlayback(); // Call the updated scheduleNextPlayback
  }, [allSamples, bpm]); // Ensure playAudioSet updates with allSamples and bpm

  const scheduleNextPlayback = useCallback(() => {
    const context = getAudioContext();
    const loop = () => {
      const elapsed = context.currentTime - startTimeRef.current;
      const secsPerMeasure = (60 / bpm) * 4;

      if (elapsed >= secsPerMeasure) {
        handleStopAllSamples();
        playAudioSet(); // Re-run with the latest allSamples and bpm
        startTimeRef.current = context.currentTime;
      }

      if (isPlayingRef.current) {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
  }, [allSamples, bpm]); // Memoize with the latest bpm and playAudioSet

  const handleStopAllSamples = () => {
    playingSources.forEach(source => source.stop());
    setPlayingSources([]);
    isPlayingRef.current = false;
  };

  return { playAudioSet, handleStopAllSamples };
};

export default useAudioPlaybackWithTimer;
