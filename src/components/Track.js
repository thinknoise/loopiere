import React from 'react';
import SampleButton from './SampleButton';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sampleSelected, handleDragStart, trackWidth, updateAllSamples, allSamples }, ref) => {

  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const relativeX = mouseX - dropArea.left;

    if (droppedSample) {
      console.log(droppedSample)
      const newSample = {
        ...droppedSample,
        id: droppedSample.indentifier,
        trackId: trackInfo.id,
        xPos: Math.round(relativeX - droppedSample.xDragOffset)/trackWidth,
      };

      // ONLY send the newsample 
      updateAllSamples(trackInfo.id, newSample)
    }
  };

  return (
    <div
      ref={ref}
      className="track drop-zone"
      onDrop={(e) => handleDrop(e, sampleSelected)}
      onDragOver={handleDragOver}
    >
      <div className="middle-line" />
      <span className="track-name">{trackInfo.name}</span>
      {allSamples.map((sampleInfo, index) => (
        <SampleButton 
          key={`${index}_${sampleInfo.id}`} 
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
