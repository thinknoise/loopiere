import React, { useState } from 'react';
import '../style/track.css'

const Track = ({ trackInfo, sample }) => {
  const [samplesOnTrack, setSamplesOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    // If there is a selected sample, add it to the track
    if (sample) {
      setSamplesOnTrack((prevSamples) => [...prevSamples, sample]);
      console.log(`Dropped Sample ${sample.filename} on Track ${trackInfo.name}`);
    }
  };

  return (
    <div
      className="track drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h4>{trackInfo.name}</h4>
      {/* Display the samples that were dropped on this track */}
      <div>
        {samplesOnTrack.map((s, index) => (
          <div key={index}>Sample: {s.filename}</div>
        ))}
      </div>
    </div>
  );
};

export default Track;
