// hooks/useTrackSequence.js
import { useState, useCallback, useEffect, useRef } from "react";
import { saveAllSamplesToLocalStorage } from "../utils/storageUtils";
import { addParamsToUrl } from "../utils/urlUtils";

const useTrackSequence = (initialBpm = 90) => {
  const [allSamples, setAllSamples] = useState([]);
  const [bpm, setBPM] = useState(initialBpm);

  // Ref to hold the latest version of allSamples & bpm
  const latestSamplesRef = useRef(allSamples);
  const latestBpm = useRef(bpm);

  // Sync latestSamplesRef with allSamples whenever allSamples changes
  useEffect(() => {
    latestSamplesRef.current = allSamples;
    latestBpm.current = bpm;
  }, [allSamples, bpm]);

  // Add or remove samples
  const editSampleOfSamples = useCallback((newSample, removeSample = false) => {
    setAllSamples((prevSamples) => {
      return removeSample
        ? prevSamples.filter((sample) => sample.id !== newSample.id)
        : [...prevSamples, newSample];
    });
  }, []);

  // Update sample positions
  const updateSamplesWithNewPosition = useCallback(
    (trackSampleId, newPosition) => {
      console.log(
        "[UPDATE POSITION] Trying to move ID:",
        trackSampleId,
        "to xPos:",
        newPosition
      );
      setAllSamples((prevSamples) =>
        prevSamples.map((sample) => {
          const match = sample.id === trackSampleId;
          console.log(`Checking sample: ${sample.id} → match? ${match}`);
          return match ? { ...sample, xPos: newPosition } : sample;
        })
      );
    },
    []
  );

  // Save to local storage
  const saveSequence = () => {
    saveAllSamplesToLocalStorage(allSamples, bpm);
  };

  const shareSequence = () => {
    addParamsToUrl(allSamples, bpm);
  };

  const clearAllSamples = () => {
    setAllSamples([]);
  };

  return {
    allSamples,
    bpm,
    latestBpm,
    setBPM,
    saveSequence,
    shareSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
    latestSamplesRef,
  };
};

export default useTrackSequence;
