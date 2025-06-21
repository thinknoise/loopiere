import { create } from "zustand";

export const useTrackNumberStore = create<{
  trackNumber: number;
  setTrackNumber: (n: number) => void;
}>((set) => ({
  trackNumber: 4,
  setTrackNumber: (n) => set({ trackNumber: n }),
}));
