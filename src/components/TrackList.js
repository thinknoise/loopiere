import React, { useState, useCallback } from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';
import useAudioPlayback from '../hooks/useAudioPlayback'; // Import the custom hook
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

  const { handlePlayAllSamples, handleStopAllSamples } = useAudioPlayback(); // Use the audio playback hook

  const tracks = generateTracks(trackNumber);

  // Memoize the update function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((trackId, samplesDroppedOnTrack) => {
    setAllSamples((prevAllSamples) => {
      // Remove samples from the same track before adding the new ones
      // const filteredSamples = prevAllSamples.filter(sample => sample.trackId !== trackId);
      console.log(prevAllSamples)

      return [...prevAllSamples, ...samplesDroppedOnTrack];
    });
  }, []);

  const bpm = 120;
  const measurePerSecond = (60 / bpm) * 4;
  const PixelsPerSecond = trackWidth / measurePerSecond;

  return (
    <div>
      <div className='track-status'>width: {trackWidth}px bpm: {bpm} measurePerSecond: {measurePerSecond} pps = {PixelsPerSecond}</div>
      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          sample={sampleSelected}
          handleDragStart={handleDragStart}
          trackWidth={trackWidth}
          updateAllSamples={updateAllSamples} // Pass the memoized function
        />
      ))}

      {/* Display consolidated samples */}
      <div className='track-sample-listing'>
        <h3>All Consolidated Samples:</h3>
        <pre>{JSON.stringify(allSamples, null, 2)}</pre>
      </div>

      {/* Button to play all samples */}
      <button onClick={() => handlePlayAllSamples(allSamples, measurePerSecond)}>Play Tracks</button>
      <button onClick={handleStopAllSamples}>Stop</button>
    </div>
  );
};

export default TrackList;
