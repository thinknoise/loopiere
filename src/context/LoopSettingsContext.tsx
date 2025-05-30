import React, { createContext, useContext, useState, ReactNode } from "react";

interface LoopSettings {
  bpm: number;
  setBpm: (value: number) => void;
  beatsPerLoop: number;
  setBeatsPerLoop: (value: number) => void;
}

const LoopSettingsContext = createContext<LoopSettings | undefined>(undefined);

export const LoopSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [bpm, setBpm] = useState(120);
  const [beatsPerLoop, setBeatsPerLoop] = useState(4);

  return (
    <LoopSettingsContext.Provider
      value={{ bpm, setBpm, beatsPerLoop, setBeatsPerLoop }}
    >
      {children}
    </LoopSettingsContext.Provider>
  );
};

export const useLoopSettings = (): LoopSettings => {
  const context = useContext(LoopSettingsContext);
  if (!context) {
    throw new Error(
      "useLoopSettings must be used within a LoopSettingsProvider"
    );
  }
  return context;
};
