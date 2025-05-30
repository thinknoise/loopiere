// src/hooks/useTrackSequence.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { saveAllSamplesToLocalStorage } from "../utils/storageUtils";
import { addParamsToUrl, SequenceParam } from "../utils/urlUtils";
import type { SampleDescriptor } from "../utils/audioManager";
import { UpdateSamplePositionFn } from "../types/sample";
import { useLoopSettings } from "../context/LoopSettingsContext";

/**
 * Edit or remove a sample in the sequence.
 */
export type EditSampleFn = (
  newSample: SampleDescriptor,
  removeSample?: boolean
) => void;

/**
 * Move a sample to a new fractional position.
 * @param trackSampleId - The numeric ID of the sample.
 * @param newPosition - New position as a fraction of track width (0–1).
 */

export interface UseTrackSequenceResult {
  allSamples: SampleDescriptor[];
  bpm: number;
  latestSamplesRef: React.MutableRefObject<SampleDescriptor[]>;
  latestBpm: React.MutableRefObject<number>;
  saveSequence: () => void;
  shareSequence: () => void;
  setAllSamples: React.Dispatch<React.SetStateAction<SampleDescriptor[]>>;
  clearAllSamples: () => void;
  editSampleOfSamples: EditSampleFn;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
}

/**
 * Custom hook for managing track sequencing state.
 * Handles adding/removing samples, moving samples, and persistence.
 *
 * @param initialBpm - Starting BPM for the sequence
 */
export default function useTrackSequence(
  initialBpm: number = 90
): UseTrackSequenceResult {
  const [allSamples, setAllSamples] = useState<SampleDescriptor[]>([]);

  const { bpm, beatsPerLoop } = useLoopSettings();

  // Refs to always read latest values inside callbacks
  const latestSamplesRef = useRef<SampleDescriptor[]>(allSamples);
  const latestBpm = useRef<number>(bpm);

  useEffect(() => {
    latestSamplesRef.current = allSamples;
    latestBpm.current = bpm;
  }, [allSamples, bpm]);

  const editSampleOfSamples: EditSampleFn = useCallback(
    (newSample, removeSample = false) => {
      setAllSamples((prev) =>
        removeSample
          ? prev.filter((sample) => sample.id !== newSample.id)
          : [...prev, newSample]
      );
    },
    []
  );

  const updateSamplesWithNewPosition: UpdateSamplePositionFn = useCallback(
    (trackSampleId, newPosition) => {
      setAllSamples((prev) =>
        prev.map((sample) =>
          sample.id === trackSampleId.id
            ? { ...sample, xPos: newPosition }
            : sample
        )
      );
    },
    []
  );

  const saveSequence = (): void => {
    saveAllSamplesToLocalStorage(allSamples, bpm, beatsPerLoop);
  };

  const shareSequence = (): void => {
    const placedParams: SequenceParam[] = allSamples
      .filter(
        (s): s is SampleDescriptor & { xPos: number } =>
          typeof s.xPos === "number"
      )
      .map((s) => ({
        trackSampleId: s.id,
        xPos: s.xPos, // now guaranteed to be a number
      }));

    addParamsToUrl(placedParams, bpm);
  };

  const clearAllSamples = (): void => {
    setAllSamples([]);
  };

  return {
    allSamples,
    bpm,
    latestSamplesRef,
    latestBpm,
    saveSequence,
    shareSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  };
}
