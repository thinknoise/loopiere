import React from 'react';
import TrackSample from './TrackSample';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sampleSelected, trackRef, updateAllSamples, allSamples }, ref) => {

  const trackWidth = trackRef?.current?.getBoundingClientRect().width
  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();
    console.log(e.clientX, dropArea.left)

    const relativeX = e.clientX - dropArea.left;

    // type this: TrackType
    // id - string, identifier - string, trackId - number, onTrack - boolean 
    // extension of sample
    if (droppedSample) {
      const newSample = {
        ...droppedSample,
        trackSampleId: `${droppedSample.identifier}-${trackInfo.id}-${Math.round(Math.random()*1000)}`, //y for now is the only identifier i can get
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
        <TrackSample 
          key={`${index}_${sampleInfo.id}`} 
          sample={sampleInfo}
          trackRef={trackRef}
          updateAllSamples={updateAllSamples}
        />
      ))}
    </div>
  );
});

export default Track;
