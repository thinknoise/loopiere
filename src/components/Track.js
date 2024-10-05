import React, { useState, useEffect } from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sample, handleDragStart, trackWidth, updateAllSamples }, ref) => {
  const [samplesDroppedOnTrack, setSamplesDroppedOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const relativeX = mouseX - dropArea.left;

    if (droppedSample) {
      const newSample = {
        ...droppedSample,
        id: samplesDroppedOnTrack.length + 1,
        trackId: trackInfo.id,
        xPos: Math.round(relativeX - droppedSample.xDragOffset)/trackWidth,
      };

      // Update the state with the new sample
      setSamplesDroppedOnTrack((prevSamples) => {
        console.log('newSample', prevSamples,newSample)
        return[...prevSamples, newSample]});
    }
  };

  // When the samplesDroppedOnTrack array updates, update the parent component
  useEffect(() => {
    updateAllSamples(trackInfo.id, samplesDroppedOnTrack);
  }, [samplesDroppedOnTrack, updateAllSamples, trackInfo.id]);

  return (
    <div
      ref={ref}
      className="track drop-zone"
      onDrop={(e) => handleDrop(e, sample)}
      onDragOver={handleDragOver}
    >
      <div className="middle-line" />
      <span className="track-name">{trackInfo.name}</span>
      {samplesDroppedOnTrack.map((sampleInfo) => (
        <SampleButton 
          key={sampleInfo.id} 
          sample={sampleInfo}
          btnClass="track-sample-btn"
          handleDragStart={handleDragStart}
          offset={sampleInfo.xPos * trackWidth}
        />
      ))}
    </div>
  );
});

export default Track;
