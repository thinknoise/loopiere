import React, { useState } from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';
import '../style/tracklist.css';

const generateTracks = (trackNumber) => {
  return Array.from({ length: trackNumber }, (_, index) => ({
    id: index + 1,
    name: `Track ${index + 1}`,
    xPos: 0,
    xDragOffset: 0,
  }));
};



const TrackList = ({ trackNumber, sampleSelected, handleDragStart }) => {
  const [trackWidth, trackRef] = useTrackWidth();
  const [allSamples, setAllSamples] = useState([]); // State to store consolidated samples

  const tracks = generateTracks(trackNumber);

  // Function to update allSamples when samplesDroppedOnTrack changes for a track
  const updateAllSamples = (trackId, samplesDroppedOnTrack) => {
    setAllSamples((prevAllSamples) => {
      // Remove samples from the same track before adding the new ones
      const filteredSamples = prevAllSamples.filter(sample => sample.trackId !== trackId);
      return [...filteredSamples, ...samplesDroppedOnTrack];
    });
  };

  return (
    <div>
      <div className='track-status'>width: {trackWidth}px</div>
      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          sample={sampleSelected}
          handleDragStart={handleDragStart}
          trackWidth={trackWidth}
          handleUpdateSamples={updateAllSamples} // Pass the update function to each track
        />
      ))}

      {/* Display consolidated samples */}
      <div className='track-sample-listing'>
        <h3>All Consolidated Samples:</h3>
        <pre>{JSON.stringify(allSamples, null, 2)}</pre>
      </div>
    </div>
  );
};

export default TrackList;
