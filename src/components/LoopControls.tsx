// src/components/LoopControls.tsx

import React, { memo, FC, Ref, useCallback, useEffect } from "react";
import { TiArrowLoop } from "react-icons/ti";
import { IoStopCircleOutline } from "react-icons/io5";
import {
  PiCloudArrowUpDuotone,
  PiEraserDuotone,
  PiCloudFogDuotone,
  PiCloudSlashDuotone,
} from "react-icons/pi";
import { Box, IconButton, Slider } from "@mui/material";
import { useLoopSettings } from "../context/LoopSettingsContext";

import useAudioPlayback, { PlaybackSample } from "../hooks/useAudioPlayback";
import useTransport from "../hooks/useTransport";

import { useTrackSampleStore } from "../stores/trackSampleStore";
import { saveAllSamplesToLocalStorage } from "../utils/storageUtils";
import { deleteSequence, loadSequence } from "../utils/loopStateManager";
import { useTrackAudioStateContext } from "../context/TrackAudioStateContext";
import { useTrackNumberStore } from "../stores/trackNumberStore";

import "../style/loopControls.css"; // Assuming you have some styles for LoopControls

const LoopControls: FC = memo(() => {
  // Beats Per Minute
  const { bpm, beatsPerLoop, setBpm, setBeatsPerLoop } = useLoopSettings();
  const { playNow, stopAll } = useAudioPlayback();
  const { trackAudioState } = useTrackAudioStateContext();

  const { trackNumber, setTrackNumber } = useTrackNumberStore();

  // All Samples from Zustand store
  const allSamples = useTrackSampleStore((s) => s.allSamples);
  const setAllSamples = useTrackSampleStore((s) => s.setAllSamples);

  const emptyTracks: boolean = allSamples.length === 0;

  const getPlacedSamples = useCallback(
    (): PlaybackSample[] =>
      allSamples.filter((s): s is PlaybackSample => typeof s.xPos === "number"),
    [allSamples]
  );

  // Play Mechanics
  const transportCallback = useCallback(() => {
    playNow(getPlacedSamples(), bpm, trackAudioState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPlacedSamples, bpm, trackAudioState]);

  const { start, stop } = useTransport(transportCallback);

  const clearSamples = useTrackSampleStore((s) => s.clearSamples);

  const onSave = () =>
    saveAllSamplesToLocalStorage(allSamples, bpm, beatsPerLoop, trackNumber);

  const onDelete = () => deleteSequence(setAllSamples, setBpm, beatsPerLoop);

  const onLoad = () =>
    loadSequence(setAllSamples, setBpm, setBeatsPerLoop, setTrackNumber);

  useEffect(() => {
    stop();
    stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatsPerLoop]);

  return (
    <Box className="control-panel">
      <Box className="control-buttons">
        <div className="tooltip-wrapper">
          <IconButton onClick={start} className="lc play-button">
            <TiArrowLoop fontSize={35} />
          </IconButton>
          <span className="tooltip-text">Play</span>
        </div>
        <div className="tooltip-wrapper">
          <IconButton
            onClick={() => {
              stop();
              stopAll();
            }}
            className="lc stop-button"
          >
            <IoStopCircleOutline fontSize={32} />
          </IconButton>
          <span className="tooltip-text">Stop</span>
        </div>
        <div className="tooltip-wrapper">
          <IconButton onClick={clearSamples} className="lc clear-button">
            <PiEraserDuotone fontSize={32} />
          </IconButton>
          <span className="tooltip-text">Clear</span>
        </div>
        <div className="tooltip-wrapper">
          <IconButton
            onClick={onSave}
            disabled={emptyTracks}
            className="lc save-button"
          >
            <PiCloudArrowUpDuotone fontSize={32} />
          </IconButton>
          <span className="tooltip-text">Save Loop</span>
        </div>
        <div className="tooltip-wrapper">
          <IconButton onClick={onLoad} className="lc load-button">
            <PiCloudFogDuotone fontSize={32} />
          </IconButton>
          <span className="tooltip-text">Load Loop</span>
        </div>
        <div className="tooltip-wrapper">
          <IconButton onClick={onDelete} className="lc delete-button">
            <PiCloudSlashDuotone fontSize={32} />
          </IconButton>
          <span className="tooltip-text">Delete Saved Loop</span>
        </div>
      </Box>
      <Box className="beats-selector">
        <select
          id="beats-select"
          value={beatsPerLoop}
          onChange={(e) => setBeatsPerLoop(Number(e.target.value))}
        >
          {Array.from({ length: 13 }, (_, i) => i + 4).map((n) => (
            <option key={n} value={n}>
              {n} beats / loop
            </option>
          ))}
        </select>
      </Box>
      <Slider
        min={40}
        max={200}
        value={bpm}
        onChange={(_, value) => setBpm(value as number)}
        valueLabelDisplay="on"
        valueLabelFormat={(value) => `${value} BPM`}
        className="bpm-slider"
      />
    </Box>
  );
});

export default LoopControls;
