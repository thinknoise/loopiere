// hooks/useTrackSequence.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { saveAllSamplesToLocalStorage, getAllSamplesFromLocalStorage } from '../utils/storageUtils';
import { addParamsToUrl } from '../utils/urlUtils';
import useAudioPlayback from './useAudioPlayback'; // Your existing custom hook

const useTrackSequence = (initialBpm = 90) => {
  const [allSamples, setAllSamples] = useState(getAllSamplesFromLocalStorage());
  const [bpm, setBPM] = useState(initialBpm);
  const bpmSliderRef = useRef(bpm);

  const { playAudioSet, handleStopAllSamples, updateSequence } = useAudioPlayback();

  // Add or remove samples
  const updateAllSamples = useCallback((newSample, removeSample = false) => {
    setAllSamples((prevSamples) => {
      return removeSample
        ? prevSamples.filter(sample => sample.trackSampleId !== newSample.trackSampleId)
        : [...prevSamples, newSample];
    });
  }, []);

  // Update sample positions
  const updateSamplesWithNewPosition = useCallback((trackSampleId, newPosition) => {
    setAllSamples((prevSamples) =>
      prevSamples.map(sample =>
        sample.trackSampleId === trackSampleId
          ? { ...sample, xPos: newPosition }
          : sample
      )
    );
  }, []);

  // Save to local storage
  const saveSequence = () => {
    saveAllSamplesToLocalStorage(allSamples, bpm);
  };

  const shareSequence = () => {
    addParamsToUrl(allSamples, bpm);
  }

  const clearAllSamples = () => {
    setAllSamples([]);
  };

  // Effect to update sequence and URL params
  useEffect(() => {
    updateSequence(allSamples, (60 / bpm) * 4);
    // lets not share the url all the time...
    // TODO, put in button
    // addParamsToUrl(allSamples, (60 / bpm) * 4);
  }, [allSamples, bpm, updateSequence]);

  return {
    allSamples,
    bpm,
    bpmSliderRef,
    playAudioSet,
    handleStopAllSamples,
    setBPM,
    saveSequence,
    shareSequence,
    setAllSamples,
    clearAllSamples,
    updateAllSamples,
    updateSamplesWithNewPosition,
  };
};

export default useTrackSequence;
