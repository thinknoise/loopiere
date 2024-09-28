import React, { useState } from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = ({ trackInfo, sample, handleDragStart }) => {
  const [samplesOnTrack, setSamplesOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e) => {
    e.preventDefault();

    // If there is a selected sample, add it to the track
    if (sample) {
      setSamplesOnTrack((prevSamples) => [...prevSamples, sample]);
      console.log(`Dropped Sample ${samplesOnTrack}`);
    }
  };

  return (
    <div
      className="track drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <span className='track-name'>{trackInfo.name}</span>
      {samplesOnTrack.map((sampleInfo, index) => (
        <div
          key={index}
          className='sample-btn track-sample-btn'
          style={{
            left: `${index * 160}px` // Programmatically set the left position (e.g., 60px apart)
          }}
        >
          <SampleButton 
            key={index} 
            id={index} 
            sample={sample}
            btnClass='track-sample-btn'
            handleDragStart={handleDragStart}
          />
        </div>
      ))}
    </div>
  );
};

export default Track;
