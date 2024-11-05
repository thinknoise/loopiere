import React, { createContext, useState, useContext, useCallback } from 'react';
import { saveAllSamplesToLocalStorage } from '../utils/storageUtils';
import { addParamsToUrl } from '../utils/urlUtils';

const SequenceContext = createContext();

export const SequenceProvider = ({ children }) => {
  const [allSamples, setAllSamples] = useState([]);
  const [bpm, setBPM] = useState(90);

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
  
  return (
    <SequenceContext.Provider value={
      {
        allSamples,
        setAllSamples,
        clearAllSamples,
        updateAllSamples,
        updateSamplesWithNewPosition,
        saveSequence,
        shareSequence,
        bpm, 
        setBPM 
      }
    }>
      {children}
    </SequenceContext.Provider>
  );
};

export const useSequenceContext = () => useContext(SequenceContext);
