// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import TrackSample from "./TrackSample";
import { TrackInfo } from "./TrackList";
import type { SampleDescriptor } from "../utils/audioManager";
import { UpdateSamplePositionFn } from "../types/sample";
import "../style/track.css";
import { getSampleFromRegistry } from "../utils/sampleRegistry";
import { useAudioContext } from "./AudioContextProvider";
import { TrackAudioState } from "../hooks/useAudioPlayback";

export interface TrackProps {
  trackInfo: TrackInfo;
  trackWidth: number;
  trackLeft: number;
  allSamples: SampleDescriptor[];
  editSampleOfSamples: (updated: SampleDescriptor) => void;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
  bpm: number;
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
      bpm,
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
      const trackSample: SampleDescriptor = {
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
            🎚️
          </button>

          <div
            ref={ref}
            className={`track drop-zone ${selected ? "track--selected" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="middle-line" />
            <span className="track-name">{trackInfo.name}</span>

            {allSamples.map((sampleInfo) => (
              <TrackSample
                key={sampleInfo.id}
                sample={sampleInfo}
                trackWidth={trackWidth}
                trackLeft={trackLeft}
                bpm={bpm}
                editSampleOfSamples={editSampleOfSamples}
                updateSamplesWithNewPosition={updateSamplesWithNewPosition}
              />
            ))}
          </div>
        </div>

        <div className={`track-control ${selected ? "expanded" : ""}`}>
          <div className="track-control-panel">
            {/* Volume */}
            <div className="slider-strip">
              <label htmlFor={`gain-${trackInfo.id}`}>vol</label>
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
            </div>

            {/* Panning */}
            <div className="slider-strip">
              <label htmlFor={`pan-${trackInfo.id}`}>pan</label>
              <input
                type="range"
                id={`pan-${trackInfo.id}`}
                min="-1"
                max="1"
                step="0.01"
                value={trackPans[trackInfo.id] ?? 0}
                className="vertical-slider"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrackPans((prev) => ({ ...prev, [trackInfo.id]: val }));
                  const panNode = trackFiltersRef.current?.get(
                    `${trackInfo.id}_pan`
                  ) as StereoPannerNode | undefined;
                  panNode?.pan.setValueAtTime(val, audioContext.currentTime);
                }}
              />
            </div>

            {/* Low-pass filter */}
            <div className="slider-strip">
              <label htmlFor={`lowpass-${trackInfo.id}`}>low</label>
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
            </div>

            {/* High-pass filter */}
            <div className="slider-strip">
              <label htmlFor={`highpass-${trackInfo.id}`}>high</label>
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
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Track;
