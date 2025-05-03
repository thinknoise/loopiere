// Track.js
import React from "react";
import TrackSample from "./TrackSample";
import { createTrackSample } from "../utils/sampleUtils";

import "../style/track.css";

const Track = React.forwardRef(
  (
    {
      trackInfo,
      trackWidth,
      trackLeft,
      editSampleOfSamples,
      allSamples,
      bpm,
      updateSamplesWithNewPosition,
    },
    ref
  ) => {
    const handleDragOver = (e) => {
      e.preventDefault(); // Necessary to allow the drop event
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const dropArea = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - dropArea.left;

      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      const droppedSample = JSON.parse(data);

      // Calculate the drop position by subtracting the drag offset.
      let dropX = Math.round(relativeX - droppedSample.xDragOffset);
      dropX = dropX < 0 ? 0 : dropX;

      const xPosFraction = dropX / trackWidth;
      const newSample = createTrackSample(
        droppedSample,
        trackInfo.id,
        xPosFraction
      );

      editSampleOfSamples(newSample);
    };

    return (
      <div
        ref={ref}
        key={`track-${trackInfo.id}`}
        className="track drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="middle-line" />
        <span className="track-name">{trackInfo.name}</span>
        {allSamples.map((sampleInfo, index) => (
          <TrackSample
            key={`${index}_${sampleInfo.id}`}
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
