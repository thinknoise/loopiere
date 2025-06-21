import React, { createContext, useContext } from "react";
import { useTrackAudioState } from "../hooks/useTrackAudioState";
import { useTrackNumberStore } from "../stores/trackNumberStore";

const TrackAudioStateContext = createContext<ReturnType<
  typeof useTrackAudioState
> | null>(null);

export const TrackAudioStateProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { trackNumber } = useTrackNumberStore();
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
