import React from 'react';
import TrackSample from './TrackSample';
import '../style/track.css';

const Track = React.forwardRef(({ trackInfo, sampleSelected, trackRef, updateAllSamples, allSamples, bpm }, ref) => {

  const trackWidth = trackRef?.current?.getBoundingClientRect().width
  const handleDragOver = (e) => {
    e.preventDefault(); // Allows drop event to occur
  };

  const handleDrop = (e, droppedSample) => {
    e.preventDefault();

    const dropArea = e.currentTarget.getBoundingClientRect();

    const relativeX = e.clientX - dropArea.left;

    // type this: TrackType
    // extension of sample
    if (droppedSample) {
      const newSample = {
        ...droppedSample,
        trackSampleId: `${droppedSample.filename}-${trackInfo.id}-${Math.round(Math.random()*1000)}`,
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
          bpm={bpm}
          updateAllSamples={updateAllSamples}
        />
      ))}
    </div>
  );
});

export default Track;
