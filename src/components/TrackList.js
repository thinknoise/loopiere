import React, { useState, useCallback } from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';
import '../style/tracklist.css'

// Assuming getAudioContext is defined elsewhere or imported
const getAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

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

  // Memoize the update function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((trackId, samplesDroppedOnTrack) => {
    setAllSamples((prevAllSamples) => {
      // Remove samples from the same track before adding the new ones
      const filteredSamples = prevAllSamples.filter(sample => sample.trackId !== trackId);
      return [...filteredSamples, ...samplesDroppedOnTrack];
    });
  }, []);

  // Function to play the audio
  const playAudioSet = (audioBuffers, offsets) => {
    if (!audioBuffers || audioBuffers.length === 0) return;

    const context = getAudioContext(); // Shared AudioContext

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.loop = true; // Enable looping
      const offsetTime = offsets[index] || 0; // Offset for each sample
      source.start(context.currentTime + offsetTime); // Start with time offset
    });
  };

  // Trigger audio playback based on consolidated samples
  const handlePlayAllSamples = () => {
    const audioBuffers = allSamples.map(sample => sample.audioBuffer); // Assuming each sample has an audioBuffer property
    const offsets = allSamples.map(sample => sample.xPos); // Use xPos as offset time
    playAudioSet(audioBuffers, offsets);
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
          handleUpdateSamples={updateAllSamples} // Pass the memoized function
        />
      ))}

      {/* Display consolidated samples */}
      <div className='track-sample-listing'>
        <h3>All Consolidated Samples:</h3>
        <pre>{JSON.stringify(allSamples, null, 2)}</pre>
      </div>

      {/* Button to play all samples */}
      <button onClick={handlePlayAllSamples}>Play All Samples</button>
    </div>
  );
};

export default TrackList;
