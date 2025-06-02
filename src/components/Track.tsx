// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import TrackSample from "./TrackSample";
import { TrackInfo } from "./TrackList";
import type { TrackSample as Sample } from "../types/audio";
import type { UpdateSamplePositionFn } from "../types/audio";
import "../style/track.css";
import { getSampleFromRegistry } from "../utils/sampleRegistry";
import { useAudioContext } from "./AudioContextProvider";
import { TrackAudioState } from "../hooks/useAudioPlayback";
import Knob from "./trackControls/knob";
import faderIcon from "../assets/faderIcon.svg";
import { useLoopSettings } from "../context/LoopSettingsContext";

export interface TrackProps {
  trackInfo: TrackInfo;
  trackWidth: number;
  trackLeft: number;
  allSamples: Sample[];
  editSampleOfSamples: (updated: Sample) => void;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
  selected: boolean;
  onSelect: () => void;
  trackAudioState: TrackAudioState;
  setTrackFrequencies: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  setTrackHighpassFrequencies: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  setTrackGains: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setTrackPans: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

const Track: FC<TrackProps & { ref?: Ref<HTMLDivElement> }> = forwardRef<
  HTMLDivElement,
  TrackProps
>(
  (
    {
      trackInfo,
      trackWidth,
      trackLeft,
      allSamples,
      editSampleOfSamples,
      updateSamplesWithNewPosition,
      selected,
      onSelect = () => {
        console.warn("Track onSelect not implemented"); // Placeholder for selection logic
      },
      setTrackFrequencies,
      setTrackHighpassFrequencies,
      setTrackGains, // ← newly added
      setTrackPans, // ← newly added
      trackAudioState: {
        filters: trackFiltersRef,
        frequencies: trackFrequencies,
        highpassFrequencies,
        gains: trackGains = {}, // pull gains out
        pans: trackPans = {}, // pull pans out
      },
    },
    ref
  ) => {
    const audioContext = useAudioContext();
    const { beatsPerLoop } = useLoopSettings();

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      // 1) Bare‐bones payload
      const { id: sampleId, xDragOffset } = JSON.parse(
        e.dataTransfer.getData("application/json")
      ) as { id: number; xDragOffset: number };

      // 2) Compute fractional position
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = Math.max(0, e.clientX - rect.left - xDragOffset);
      const xPos = dropX / trackWidth;

      // 3) Rehydrate the original sample from your registry
      const original = getSampleFromRegistry(sampleId);
      console.log("Dropped ID:", sampleId, "Original:", original);
      if (!original) return;

      // 4) Create a fresh trackSample
      const trackSample: Sample = {
        ...original,
        trackId: trackInfo.id,
        xPos,
        onTrack: true,
        id: Date.now(),
      };

      // 5) Insert into your hook state
      editSampleOfSamples(trackSample);
    };

    return (
      <div className="track-container">
        <div className="track-row">
          <button
            className="track-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <img
              src={faderIcon}
              alt="Toggle Track"
              className={`track-toggle-icon ${selected ? "active" : ""}`}
            />
          </button>

          <div
            ref={ref}
            className={`track drop-zone ${selected ? "track--selected" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <span className="track-name">{trackInfo.name}</span>
            {Array.from({ length: beatsPerLoop - 1 }).map((_, i) => (
              <div
                key={i}
                className="beat-line"
                style={{
                  left: `${((i + 1) / beatsPerLoop) * 100}%`,
                }}
              />
            ))}

            {/* TRACK CONTROL */}

            {allSamples.map((sampleInfo) => (
              <TrackSample
                key={sampleInfo.id}
                sample={sampleInfo}
                trackWidth={trackWidth}
                trackLeft={trackLeft}
                editSampleOfSamples={editSampleOfSamples}
                updateSamplesWithNewPosition={updateSamplesWithNewPosition}
              />
            ))}
          </div>
        </div>

        <div className={`track-control ${selected ? "expanded" : ""}`}>
          <div className="track-control-panel">
            <div className="control-item slider-strip">
              {/* Pan knob above the volume slider */}
              <div className="control-item knob-strip">
                <Knob
                  value={trackPans[trackInfo.id] ?? 0}
                  onChange={(val) => {
                    setTrackPans((prev) => ({ ...prev, [trackInfo.id]: val }));
                    const panNode = trackFiltersRef.current?.get(
                      `${trackInfo.id}_pan`
                    ) as StereoPannerNode | undefined;
                    panNode?.pan.setValueAtTime(val, audioContext.currentTime);
                  }}
                  size={20}
                />
              </div>

              {/* Volume slider */}
              <input
                type="range"
                id={`gain-${trackInfo.id}`}
                min="0"
                max="1"
                step="0.01"
                value={trackGains[trackInfo.id] ?? 1}
                className="vertical-slider"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrackGains((prev) => ({ ...prev, [trackInfo.id]: val }));
                  const gainNode = trackFiltersRef.current?.get(
                    `${trackInfo.id}_gain`
                  ) as GainNode | undefined;
                  gainNode?.gain.setValueAtTime(val, audioContext.currentTime);
                }}
              />
              <label htmlFor={`gain-${trackInfo.id}`}>vol</label>
            </div>

            {/* Low-pass filter */}
            <div className="control-item slider-strip">
              <input
                type="range"
                id={`lowpass-${trackInfo.id}`}
                min="80"
                max="5000"
                step="10"
                value={trackFrequencies[trackInfo.id] ?? 400}
                className="vertical-slider"
                onChange={(e) => {
                  const freq = parseFloat(e.target.value);
                  setTrackFrequencies((prev) => ({
                    ...prev,
                    [trackInfo.id]: freq,
                  }));
                  const lowF = trackFiltersRef.current?.get(
                    `${trackInfo.id}_lowpass`
                  ) as BiquadFilterNode | undefined;
                  lowF?.frequency.setValueAtTime(
                    freq,
                    audioContext.currentTime
                  );
                }}
              />
              <label htmlFor={`lowpass-${trackInfo.id}`}>low</label>
            </div>

            {/* High-pass filter */}
            <div className="control-item slider-strip">
              <input
                type="range"
                id={`highpass-${trackInfo.id}`}
                min="80"
                max="5000"
                step="10"
                value={highpassFrequencies[trackInfo.id] ?? 400}
                className="vertical-slider"
                onChange={(e) => {
                  const freq = parseFloat(e.target.value);
                  setTrackHighpassFrequencies((prev) => ({
                    ...prev,
                    [trackInfo.id]: freq,
                  }));
                  const highF = trackFiltersRef.current?.get(
                    `${trackInfo.id}_highpass`
                  ) as BiquadFilterNode | undefined;
                  highF?.frequency.setValueAtTime(
                    freq,
                    audioContext.currentTime
                  );
                }}
              />
              <label htmlFor={`highpass-${trackInfo.id}`}>high</label>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Track;
