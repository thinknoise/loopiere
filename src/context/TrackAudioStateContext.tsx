import React, { createContext, useContext } from "react";
import { useTrackAudioState } from "../hooks/useTrackAudioState";

const TrackAudioStateContext = createContext<ReturnType<
  typeof useTrackAudioState
> | null>(null);

export const TrackAudioStateProvider: React.FC<{
  trackNumber: number;
  children: React.ReactNode;
}> = ({ trackNumber, children }) => {
  const state = useTrackAudioState(trackNumber);
  return (
    <TrackAudioStateContext.Provider value={state}>
      {children}
    </TrackAudioStateContext.Provider>
  );
};

export const useTrackAudioStateContext = () => {
  const ctx = useContext(TrackAudioStateContext);
  if (!ctx) throw new Error("TrackAudioStateContext used outside provider");
  return ctx;
};
