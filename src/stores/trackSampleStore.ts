// src/stores/trackSampleStore.ts
import { create } from "zustand";
import type { TrackSampleType } from "@/types/audio";

type TrackSampleState = {
  allSamples: TrackSampleType[];

  // Actions
  setAllSamples: (samples: TrackSampleType[]) => void;
  addSample: (sample: TrackSampleType) => void;
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
