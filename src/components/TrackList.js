import React, { useState, useCallback, useEffect } from 'react';
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
    samples: []
  }));
};

const TrackList = ({ trackNumber, sampleSelected, handleDragStart }) => {
  const [trackWidth, trackRef] = useTrackWidth();
  const [allSamples, setAllSamples] = useState([]); // State to store consolidated samples

  const { handlePlayAllSamples, handleStopAllSamples } = useAudioPlayback(); // Use the audio playback hook

  const tracks = generateTracks(trackNumber);

  // Memoize the update function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((trackId, newSample) => {
    setAllSamples((prevAllSamples) => {
      const updatedSamples = prevAllSamples.filter(sample => {
        console.log(sample.identifier, newSample)
        return sample.identifier !== newSample.identifier && sample.trackId !== newSample.trackId
      });
      return[...updatedSamples, newSample]});
  }, []);

  useEffect(() => {
    // console.log(allSamples);
  }, [allSamples]);


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
          sampleSelected={sampleSelected}
          handleDragStart={handleDragStart}
          trackWidth={trackWidth}
          // samplesOnThisTrack={track.samples}
          updateAllSamples={updateAllSamples} // Pass the memoized function
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
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
