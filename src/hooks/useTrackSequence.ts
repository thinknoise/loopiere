// src/hooks/useTrackSequence.ts

import { useCallback, useEffect, useRef } from "react";
import { saveAllSamplesToLocalStorage } from "../utils/storageUtils";
import { addParamsToUrl, SequenceParam } from "../utils/urlUtils";
import type { TrackSample } from "../types/audio";
import type { UpdateSamplePositionFn } from "../types/audio";
import { useLoopSettings } from "../context/LoopSettingsContext";
import { useTrackSampleStore } from "../stores/trackSampleStore";

export type EditSampleFn = (
  newSample: TrackSample,
  removeSample?: boolean
) => void;

export interface UseTrackSequenceResult {
  allSamples: TrackSample[];
  bpm: number;
  latestSamplesRef: React.MutableRefObject<TrackSample[]>;
  latestBpm: React.MutableRefObject<number>;
  shareSequence: () => void;
  setAllSamples: (samples: TrackSample[]) => void;
  clearAllSamples: () => void;
  editSampleOfSamples: EditSampleFn;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
}

export default function useTrackSequence(): UseTrackSequenceResult {
  const { bpm } = useLoopSettings();

  const allSamples = useTrackSampleStore((s) => s.allSamples);
  const setAllSamples = useTrackSampleStore((s) => s.setAllSamples);
  const clearAllSamples = useTrackSampleStore((s) => s.clearSamples);

  const latestSamplesRef = useRef<TrackSample[]>(allSamples);
  const latestBpm = useRef<number>(bpm);

  useEffect(() => {
    latestSamplesRef.current = allSamples;
    latestBpm.current = bpm;
  }, [allSamples, bpm]);

  const editSampleOfSamples: EditSampleFn = useCallback(
    (newSample, removeSample = false) => {
      const prev = useTrackSampleStore.getState().allSamples;
      const next = removeSample
        ? prev.filter((sample) => sample.id !== newSample.id)
        : [...prev, newSample];
      setAllSamples(next);
    },
    [setAllSamples]
  );

  const updateSamplesWithNewPosition: UpdateSamplePositionFn = useCallback(
    (trackSampleId, newPosition) => {
      const prev = useTrackSampleStore.getState().allSamples;
      const updated = prev.map((sample) =>
        sample.id === trackSampleId.id
          ? { ...sample, xPos: newPosition }
          : sample
      );
      setAllSamples(updated);
    },
    [setAllSamples]
  );

  const shareSequence = (): void => {
    const placedParams: SequenceParam[] = allSamples
      .filter((s): s is TrackSample => typeof s.xPos === "number")
      .map((s) => ({
        trackSampleId: s.id,
        xPos: s.xPos,
      }));

    addParamsToUrl(placedParams, bpm);
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
