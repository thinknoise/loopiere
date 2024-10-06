import React from 'react';
import TrackButton from './TrackButton';
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
    console.log(droppedSample)

    if (droppedSample) {
      const newSample = {
        ...droppedSample,
        id: droppedSample.indentifier,
        trackId: trackInfo.id,
        onTrack: true,
        xPos: Math.round(relativeX - droppedSample.xDragOffset)/trackWidth,
      };

      // ONLY send the newsample 
      updateAllSamples(newSample)
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
        <TrackButton 
          key={`${index}_${sampleInfo.id}`} 
          sample={sampleInfo}
          offset={sampleInfo.xPos * trackWidth}
        />
      ))}
    </div>
  );
});

export default Track;
