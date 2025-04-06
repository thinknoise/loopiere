// Track.js
import React from 'react';
import { useSelectedSample } from '../context/SelectedSampleContext';
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
  const { selectedSample, updateSelectedSample } = useSelectedSample();

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow the drop event
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropArea = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - dropArea.left;

    if (selectedSample) {
      const newSample = {
        ...selectedSample,
        trackSampleId: `${selectedSample.filename}-${trackInfo.id}-${Math.round(Math.random() * 1000)}`,
        trackId: trackInfo.id,
        onTrack: true,
        xPos: Math.round(relativeX - selectedSample.xDragOffset) / trackWidth,
      };

      editSampleOfSamples(newSample);
      // Clear the selected sample after it is dropped onto the track.
      updateSelectedSample(null);
    }
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
});

export default Track;
