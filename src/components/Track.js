import React, { useState } from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sample, handleDragStart }, ref) => {
  const [samplesDroppedOnTrack, setSamplesDroppedOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
    const targetRect = e.currentTarget.getBoundingClientRect();

    // need to set the x of the dragging item
    console.log(targetRect.top, e.clientY)
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const relativeX = mouseX - dropArea.left;

    // If there is a selected sample, add it to the track
    if (droppedSample) {
      droppedSample.xPos = Math.round(relativeX - droppedSample.xDragOffset); 
      setSamplesDroppedOnTrack((prevSamples) => [...prevSamples, droppedSample]);
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
      <span className='track-name'>{trackInfo.name}</span>
      {samplesDroppedOnTrack.map((sampleInfo, index) => (
        <div
          key={index}
          className='on-track'
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
});

export default Track;
