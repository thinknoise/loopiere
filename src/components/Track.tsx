// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import TrackSample from "./TrackSample";
import { createTrackSample } from "../utils/sampleUtils";
import { TrackInfo } from "./TrackList";
import type { SampleDescriptor } from "../utils/audioManager";
import { UpdateSamplePositionFn } from "../types/sample";
import "../style/track.css";

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

    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      if (!ref || !(ref as React.RefObject<HTMLDivElement>).current) return;

      const dropArea = (
        ref as React.RefObject<HTMLDivElement>
      ).current!.getBoundingClientRect();
      const relativeX = e.clientX - dropArea.left;

      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      const droppedSample = JSON.parse(data) as any;
      const xDragOffset = droppedSample.xDragOffset ?? 0;

      const dropX = Math.max(0, Math.round(relativeX - xDragOffset));
      const xPosFraction = dropX / trackWidth;

      const updated = createTrackSample(
        droppedSample,
        trackInfo.id,
        xPosFraction
      );

      editSampleOfSamples(updated);
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
