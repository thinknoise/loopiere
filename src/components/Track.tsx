// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import TrackSample from "./TrackSample";
import { TrackInfo } from "./TrackList";
import type { SampleDescriptor } from "../utils/audioManager";
import { UpdateSamplePositionFn } from "../types/sample";
import "../style/track.css";
import { getSampleFromRegistry } from "../utils/sampleRegistry";

export interface TrackProps {
  trackInfo: TrackInfo;
  trackWidth: number;
  trackLeft: number;
  allSamples: SampleDescriptor[];
  editSampleOfSamples: (updated: SampleDescriptor) => void;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
  bpm: number;
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
    },
    ref
  ) => {
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
      <div
        ref={ref}
        className="track drop-zone"
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
    );
  }
);

export default Track;
