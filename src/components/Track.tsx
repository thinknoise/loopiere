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

interface DragPayload {
  id: number;
  xDragOffset: number;
  filename?: string;
  path?: string;
  url?: string;
  buffer?: any; // we’ll ignore buffer here
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
      const { id, xDragOffset, filename, path, url } = JSON.parse(
        e.dataTransfer.getData("application/json")
      ) as DragPayload;

      // compute xPosFraction…
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = Math.max(0, e.clientX - rect.left - xDragOffset);
      const xPos = dropX / trackWidth;

      // Reconstruct the “original” descriptor:
      let original: SampleDescriptor;
      if (path || url) {
        // Bank or recorded (via blob URL) – we have all the fields we need
        original = {
          id,
          filename: filename!,
          path,
          url,
          buffer: null, // will be loaded lazily via useAudioBuffer
          xPos: 0, // placeholder
        };
      } else {
        // Pure ID fallback (unlikely now)
        original =
          allSamples.find((s) => s.id === id) || ({} as SampleDescriptor);
      }

      // Now stamp on track placement
      const trackSample: SampleDescriptor = {
        ...original,
        id: Date.now(),
        trackId: trackInfo.id,
        xPos,
        onTrack: true,
      };

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
