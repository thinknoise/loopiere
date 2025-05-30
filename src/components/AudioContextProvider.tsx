// src/components/AudioContextProvider.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  FC,
} from "react";
import { getAudioContext } from "../utils/audioContextSetup";
import { LoopSettingsProvider } from "../context/LoopSettingsContext";

type AudioCtxType = AudioContext;

// Initialize context with null
const AudioContextCtx = createContext<AudioCtxType | null>(null);

interface AudioContextProviderProps {
  children: ReactNode;
}

export const AudioContextProvider: FC<AudioContextProviderProps> = ({
  children,
}) => {
  const audioCtx = useMemo<AudioCtxType>(() => getAudioContext(), []);

  return (
    <AudioContextCtx.Provider value={audioCtx}>
      <LoopSettingsProvider>
        {/* Wrap children with LoopSettingsProvider */}
        {children}
      </LoopSettingsProvider>
    </AudioContextCtx.Provider>
  );
};

export const useAudioContext = (): AudioCtxType => {
  const ctx = useContext(AudioContextCtx);
  if (ctx === null) {
    throw new Error("useAudioContext must be used within AudioContextProvider");
  }
  return ctx;
};
