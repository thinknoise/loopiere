// LoopMemory.js
import React, { useState, useCallback } from "react";
import LoopControls from "./LoopControls";
import Track from "./Track";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "../utils/storageUtils";
import { addParamsToUrl } from "../utils/urlUtils";
import { getWaveformData } from "../utils/waveformUtils";

export default function LoopMemory() {
  const [allSamples, setAllSamples] = useState([]);
  const [bpm, setBPM] = useState(
    Number(localStorage.getItem("LoopiereBPM")) || 120
  );

  const onSave = useCallback(() => {
    saveAllSamplesToLocalStorage(allSamples, bpm);
  }, [allSamples, bpm]);

  const onLoad = useCallback(async () => {
    const ctx = new AudioContext();
    const loaded = await getAllSamplesFromLocalStorage(ctx);
    setAllSamples(loaded);

    const storedBpm = Number(localStorage.getItem("LoopiereBPM"));
    if (!isNaN(storedBpm)) setBPM(storedBpm);
  }, []);

  const onShare = useCallback(() => {
    addParamsToUrl(allSamples, bpm);
  }, [allSamples, bpm]);

  const onClear = useCallback(() => {
    setAllSamples([]);
  }, []);

  return (
    <div className="p-4">
      <LoopControls
        onSave={onSave}
        onLoad={onLoad}
        onShare={onShare}
        onClear={onClear}
      />
      <div>
        {allSamples.map((sample, index) => (
          <Track
            key={index}
            sample={sample}
            bpm={bpm}
            getWaveformData={getWaveformData}
          />
        ))}
      </div>
    </div>
  );
}
