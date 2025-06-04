// src/stores/trackSampleStore.ts
import { create } from "zustand";
import { TrackSample } from "@/types/audio";

type TrackSampleState = {
  allSamples: TrackSample[];

  // Actions
  setAllSamples: (samples: TrackSample[]) => void;
  addSample: (sample: TrackSample) => void;
  removeSample: (id: number) => void;
  clearSamples: () => void;
};

export const useTrackSampleStore = create<TrackSampleState>((set) => ({
  allSamples: [],

  setAllSamples: (samples) => set({ allSamples: samples }),

  addSample: (sample) =>
    set((state) => ({
      allSamples: [...state.allSamples, sample],
    })),

  removeSample: (id) =>
    set((state) => ({
      allSamples: state.allSamples.filter((s) => s.id !== id),
    })),

  clearSamples: () => set({ allSamples: [] }),
}));
