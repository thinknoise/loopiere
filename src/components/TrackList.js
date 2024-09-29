import React from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';

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

  const tracks = generateTracks(trackNumber);

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
        />
      ))}
    </div>
  );
};

export default TrackList;
