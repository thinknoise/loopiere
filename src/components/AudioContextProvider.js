// AudioContextProvider.js
import React, { createContext, useContext, useMemo } from "react";
import { getAudioContext } from "../utils/audioContextSetup";

const AudioContextCtx = createContext(null);

export function AudioContextProvider({ children }) {
  const ctx = useMemo(() => getAudioContext(), []);
  return (
    <AudioContextCtx.Provider value={ctx}>{children}</AudioContextCtx.Provider>
  );
}

export const useAudioContext = () => {
  const ctx = useContext(AudioContextCtx);
  if (!ctx) throw new Error("Must wrap in <AudioContextProvider>");
  return ctx;
};
