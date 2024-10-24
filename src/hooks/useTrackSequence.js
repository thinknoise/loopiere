// hooks/useTrackSequence.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { saveAllSamplesToLocalStorage, getAllSamplesFromLocalStorage } from '../utils/storageUtils';
import { addParamsToUrl } from '../utils/urlUtils';
import useAudioPlayback from './useAudioPlayback'; // Your existing custom hook

const useTrackSequence = (initialBpm = 90) => {
  const [allSamples, setAllSamples] = useState(getAllSamplesFromLocalStorage());
  const [bpm, setBPM] = useState(initialBpm);
  const bpmSliderRef = useRef(bpm);

  const { playAudioSet, handleStopAllSamples, updateSequenceForPlayback } = useAudioPlayback();

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
    // this updates the playback sequence
    // whenever there is an adition or modification
    // all the samples in array, min into seconds times beats
    updateSequenceForPlayback(allSamples, (60 / bpm) * 4);

  }, [allSamples, bpm, updateSequenceForPlayback]);

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
