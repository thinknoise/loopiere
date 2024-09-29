import React, { useState, useEffect } from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = ({ trackInfo, sample, handleDragStart }) => {
  const [samplesDroppedOnTrack, setSamplesDroppedOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();
  
    // Get the drop area's bounding rectangle
    const dropArea = e.currentTarget.getBoundingClientRect();

    // Get the mouse position relative to the viewport
    const mouseX = e.clientX;
    
    // Calculate the mouse position relative to the drop area
    const relativeX = mouseX - dropArea.left;

    // If there is a selected sample, add it to the track
    if (droppedSample) {
      droppedSample.xPos = Math.round(relativeX);
      setSamplesDroppedOnTrack((prevSamples) => [...prevSamples, droppedSample]);
      // console.log(`Dropped Sample:`, droppedSample, `at position ${relativeX}`);
    }
  };
  
  return (
    <div
      className="track drop-zone"
      onDrop={(e) => handleDrop(e, sample)}
      onDragOver={handleDragOver}
    >
      <span className='track-name'>{trackInfo.name}</span>
      {samplesDroppedOnTrack.map((sampleInfo, index) => (
        <div
          key={index}
          className='sample-btn track-sample-btn'
          style={{
            left: `${sampleInfo.xPos}px`
          }}
        >
          <SampleButton 
            key={index} 
            id={index} 
            sample={sampleInfo}
            btnClass='track-sample-btn'
            handleDragStart={handleDragStart}
          />
        </div>
      ))}
    </div>
  );
};

export default Track;
