// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import TrackSample from "./TrackSample";
import { TrackInfo } from "./TrackList";
import type { SampleDescriptor } from "../utils/audioManager";
import { UpdateSamplePositionFn } from "../types/sample";
import "../style/track.css";
import { getSampleFromRegistry } from "../utils/sampleRegistry";
import { useAudioContext } from "./AudioContextProvider";

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
  trackFiltersRef: React.RefObject<Map<number, BiquadFilterNode>>;
  trackFrequencies: Record<number, number>;
  setTrackFrequencies: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
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
      trackFiltersRef,
      trackFrequencies,
      setTrackFrequencies,
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
            <div className="slider-group">
              <label htmlFor="filterFreq">Freq</label>
              <input
                type="range"
                id="filterFreq"
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
                  const filter = trackFiltersRef.current?.get(trackInfo.id);
                  if (filter) {
                    filter.frequency.setValueAtTime(
                      freq,
                      audioContext.currentTime
                    );
                  }
                }}
              />
            </div>
            {/* You can add more sliders here later */}
          </div>
        </div>
      </div>
    );
  }
);

export default Track;
