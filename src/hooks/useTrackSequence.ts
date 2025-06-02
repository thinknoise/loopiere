// src/hooks/useTrackSequence.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { saveAllSamplesToLocalStorage } from "../utils/storageUtils";
import { addParamsToUrl, SequenceParam } from "../utils/urlUtils";
import type { TrackSample } from "../types/audio";
import type { UpdateSamplePositionFn } from "../types/audio";
import { useLoopSettings } from "../context/LoopSettingsContext";

/**
 * Edit or remove a sample in the sequence.
 */
export type EditSampleFn = (
  newSample: TrackSample,
  removeSample?: boolean
) => void;

/**
 * Move a sample to a new fractional position.
 * @param trackSampleId - The numeric ID of the sample.
 * @param newPosition - New position as a fraction of track width (0–1).
 */

export interface UseTrackSequenceResult {
  allSamples: TrackSample[];
  bpm: number;
  latestSamplesRef: React.MutableRefObject<TrackSample[]>;
  latestBpm: React.MutableRefObject<number>;
  shareSequence: () => void;
  setAllSamples: React.Dispatch<React.SetStateAction<TrackSample[]>>;
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
  const [allSamples, setAllSamples] = useState<TrackSample[]>([]);

  const { bpm } = useLoopSettings();

  // Refs to always read latest values inside callbacks
  const latestSamplesRef = useRef<TrackSample[]>(allSamples);
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

  const shareSequence = (): void => {
    const placedParams: SequenceParam[] = allSamples
      .filter((s): s is TrackSample => typeof s.xPos === "number")
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
    shareSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  };
}
