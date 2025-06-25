// utils/loopStateManager.ts

import type { TrackSampleType } from "../types/audio";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "./storageUtils";

export async function loadSequence(
  setAllSamples: (samples: TrackSampleType[]) => void,
  setBpm: (bpm: number) => void,
  setBeatsPerLoop: (beatsPerLoop: number) => void,
  setTrackNumber: (tracNumber: number) => void
) {
  const audioContext = new AudioContext();
  const { bpm, beatsPerLoop, samples, trackNumber } =
    await getAllSamplesFromLocalStorage(audioContext);
  setBpm(bpm);
  setBeatsPerLoop(beatsPerLoop);
  setAllSamples(samples);
  setTrackNumber(trackNumber);

  const stored = Number(localStorage.getItem("LoopiereSavedLoopV2"));
  if (!isNaN(stored)) setBpm(stored);
}

export function deleteSequence(
  setAllSamples: (samples: TrackSampleType[]) => void,
  setBpm: (bpm: number) => void,
  beatsPerLoop: number
) {
  const initialBpm = 80; // just to have a number
  saveAllSamplesToLocalStorage([], initialBpm, beatsPerLoop, 4);
  setAllSamples([]);
  setBpm(initialBpm);
}

export function clearSamples(
  setAllSamples: (samples: TrackSampleType[]) => void
) {
  setAllSamples([]);
}
