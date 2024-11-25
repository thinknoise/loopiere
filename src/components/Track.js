import React from 'react';
import TrackSample from './TrackSample';
import '../style/track.css';

const Track = React.forwardRef(({ 
    trackInfo, 
    sampleSelected, 
    trackWidth,
    trackLeft,
    editSampleOfSamples, 
    allSamples, 
    bpm, updateSamplesWithNewPosition 
  }, ref) => {

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
      editSampleOfSamples(newSample)
    }
  };

  return (
    <div
      ref={ref}
      key={`track-${trackInfo.id}`} 
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
          trackWidth={trackWidth}
          trackLeft={trackLeft}
          bpm={bpm}
          editSampleOfSamples={editSampleOfSamples}
          updateSamplesWithNewPosition={updateSamplesWithNewPosition}
        />
      ))}
    </div>
  );
});

export default Track;
