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

const TrackList = ({ trackNumber, sampleSelected }) => {
  const [trackWidth, trackRef] = useTrackWidth();
  const [allSamples, setAllSamples] = useState([]); // State to store consolidated samples

  const { playAudioSet, handleStopAllSamples, updateSequnce } = useAudioPlayback(); // Use the audio playback hook

  const tracks = generateTracks(trackNumber);

  // Memoize the update function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((newSample) => {
    // Immediately update the ref along with state update
    setAllSamples((prevAllSamples) => {
      const updatedSamples = [...prevAllSamples, newSample];
      return updatedSamples; // Return the updated state
    });
  }, []);

  useEffect(() => {
    console.log("Latest allSamples:", allSamples);
    // Trigger the playback when allSamples are updated
    updateSequnce(allSamples, (60 / 120) * 4); // Pass the latest tempo value (bpm)
  }, [allSamples]); // Add a dependency on allSamples to ensure playback uses the latest samples

  const handleClearLoop = () => {
    setAllSamples([]);
  };

  const bpm = 120;
  const measurePerSecond = (60 / bpm) * 4;
  const PixelsPerSecond = trackWidth / measurePerSecond;

  return (
    <div>
      <div className='track-status'>
        width: {trackWidth}px bpm: {bpm} measurePerSecond: {measurePerSecond} pps = {PixelsPerSecond}
      </div>
      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          sampleSelected={sampleSelected}
          trackWidth={trackWidth}
          updateAllSamples={updateAllSamples} // Pass the memoized function
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
        />
      ))}

      {/* Display samples in loop in lower left */}
      <div className='track-sample-listing'>
        <h3>All Consolidated Samples:</h3>
        <pre>{JSON.stringify(allSamples, null, 2)}</pre>
      </div>

      {/* Button to play all samples */}
      <button onClick={() => playAudioSet(allSamples, measurePerSecond)}>Play Tracks</button>
      <button onClick={handleStopAllSamples}>Stop</button>
      <button onClick={handleClearLoop}>Clear Loop</button>
    </div>
  );
};

export default TrackList;
