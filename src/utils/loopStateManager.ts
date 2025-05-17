// utils/loopStateManager.ts

import { SampleDescriptor } from "./audioManager";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "./storageUtils";

export function saveSequence(samples: SampleDescriptor[], bpm: number) {
  saveAllSamplesToLocalStorage(samples, bpm);
}

export async function loadSequence(
  setAllSamples: (samples: SampleDescriptor[]) => void,
  setBpm: (bpm: number) => void
) {
  const audioContext = new AudioContext();
  const restored = await getAllSamplesFromLocalStorage(audioContext);
  setAllSamples(restored);

  const stored = Number(localStorage.getItem("LoopiereBPM"));
  if (!isNaN(stored)) setBpm(stored);
}

export function deleteSequence(
  setAllSamples: (samples: SampleDescriptor[]) => void,
  setBpm: (bpm: number) => void,
  initialBpm: number
) {
  saveAllSamplesToLocalStorage([], initialBpm);
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
