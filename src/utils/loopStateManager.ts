// utils/loopStateManager.ts

import { SampleDescriptor } from "./audioManager";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "./storageUtils";

export function saveSequence(
  samples: SampleDescriptor[],
  bpm: number,
  beatsPerLoop: number
) {
  saveAllSamplesToLocalStorage(samples, bpm, beatsPerLoop);
}

export async function loadSequence(
  setAllSamples: (samples: SampleDescriptor[]) => void,
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
  setAllSamples: (samples: SampleDescriptor[]) => void,
  setBpm: (bpm: number) => void,
  initialBpm: number,
  beatsPerLoop: number
) {
  saveAllSamplesToLocalStorage([], initialBpm, beatsPerLoop);
  setAllSamples([]);
  setBpm(initialBpm);
}

export function clearSamples(
  setAllSamples: (samples: SampleDescriptor[]) => void
) {
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
