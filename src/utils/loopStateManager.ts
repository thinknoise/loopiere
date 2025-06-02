// utils/loopStateManager.ts

import type { TrackSample } from "../types/audio";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "./storageUtils";

export function saveSequence(
  samples: TrackSample[],
  bpm: number,
  beatsPerLoop: number
) {
  saveAllSamplesToLocalStorage(samples, bpm, beatsPerLoop);
}

export async function loadSequence(
  setAllSamples: (samples: TrackSample[]) => void,
  setBpm: (bpm: number) => void,
  setBeatsPerLoop: (beatsPerLoop: number) => void
) {
  const audioContext = new AudioContext();
  const { bpm, beatsPerLoop, samples } = await getAllSamplesFromLocalStorage(
    audioContext
  );
  setBpm(bpm);
  setBeatsPerLoop(beatsPerLoop);
  setAllSamples(samples);

  const stored = Number(localStorage.getItem("LoopiereSavedLoopV2"));
  if (!isNaN(stored)) setBpm(stored);
}

export function deleteSequence(
  setAllSamples: (samples: TrackSample[]) => void,
  setBpm: (bpm: number) => void,
  initialBpm: number,
  beatsPerLoop: number
) {
  saveAllSamplesToLocalStorage([], initialBpm, beatsPerLoop);
  setAllSamples([]);
  setBpm(initialBpm);
}

export function clearSamples(setAllSamples: (samples: TrackSample[]) => void) {
  setAllSamples([]);
}

export function changeBpm(
  setBpm: (bpm: number) => void,
  value: number | number[]
) {
  if (typeof value === "number") {
    setBpm(value);
  } else {
    setBpm(value[88]);
  }
}
