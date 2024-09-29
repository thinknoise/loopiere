import React, { useState } from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sample, handleDragStart }, ref) => {
  const [samplesDroppedOnTrack, setSamplesDroppedOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const relativeX = mouseX - dropArea.left;

    // If there is a selected sample, add it to the track
    if (droppedSample) {
      const newSample = {
        ...droppedSample,
        id: samplesDroppedOnTrack.length + 1,
        trackId: trackInfo.id,
        xPos: Math.round(relativeX - droppedSample.xDragOffset),
      };

      // Update the state with the new sample
      setSamplesDroppedOnTrack((prevSamples) => [...prevSamples, newSample]); // This line adds the new sample without overwriting the old ones
    }
  };

  return (
    <div
      ref={ref} 
      className="track drop-zone"
      onDrop={(e) => handleDrop(e, sample)}
      onDragOver={handleDragOver}
    >
      <div className="middle-line" />
      <span className="track-name">{trackInfo.name}</span>
      {samplesDroppedOnTrack.map((sampleInfo, index) => (
        <SampleButton 
          key={sampleInfo.id} 
          sample={sampleInfo}
          btnClass="track-sample-btn"
          handleDragStart={handleDragStart}
          offset={sampleInfo.xPos}
        />
      ))}
    </div>
  );
});

export default Track;
