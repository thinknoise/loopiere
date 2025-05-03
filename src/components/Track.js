// Track.js
import React from 'react';
import { useDrag } from '../context/DragContext';     // ← use the drag context
import TrackSample from './TrackSample';
import '../style/track.css';

const Track = React.forwardRef(({
  trackInfo,
  trackWidth,
  trackLeft,
  editSampleOfSamples,
  allSamples,
  bpm,
  updateSamplesWithNewPosition
}, ref) => {
  const { dragItem, updateDragItem } = useDrag();     // ← grab dragItem

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!dragItem) return;

    const dropArea = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - dropArea.left;
    let dropX = Math.round(relativeX - dragItem.xDragOffset);
    dropX = Math.max(dropX, 0);

    const newSample = {
      ...dragItem,
      trackSampleId: `${dragItem.filename}-${trackInfo.id}-${Math.round(Math.random() * 1000)}`,
      trackId: trackInfo.id,
      onTrack: true,
      xPos: dropX / trackWidth,
    };

    editSampleOfSamples(newSample);
    updateDragItem(null);                             // ← clear the drag item
  };

  return (
    <div
      ref={ref}
      className="track drop-zone"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="middle-line" />
      <span className="track-name">{trackInfo.name}</span>
      {allSamples.map((sampleInfo, idx) => (
        <TrackSample
          key={sampleInfo.trackSampleId}
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
});

export default Track;
