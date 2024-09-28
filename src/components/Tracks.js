import React, { useState } from 'react';
import '../style/track.css';

const Track = ({ trackInfo, sample }) => {
  const [samplesOnTrack, setSamplesOnTrack] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = (e, sample) => {
      e.preventDefault();
      
      console.log(sample)
      setSamplesOnTrack((prevSamples) => [...prevSamples, sample]);

      console.log(`Dropped Button ${sample}`);
  };

  return (
    <div
      key={trackInfo.id}
      className="drop-zone"
      onDrop={(e) => handleDrop(e)}
      onDragOver={(e) => handleDragOver(e, sample)}
    >
      {trackInfo.name} Drop Buttons Here
      {samplesOnTrack.map((sample) => 
        <div key={sample.id}> whammo {sample} </div>
      )}
    </div>
  );
};
export default Track;