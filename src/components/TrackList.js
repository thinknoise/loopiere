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
  const updateAllSamples = useCallback((newSample, removeSample = false) => {
    // Immediately update the ref along with state update
    setAllSamples((prevAllSamples) => {
      if (removeSample) {
        // filter out the "newsample" 
        const filteredSamples = prevAllSamples.filter((sample => sample.trackSampleId !== newSample.trackSampleId)) 
        return [...filteredSamples];
      } else {
        return [...prevAllSamples, newSample];
      }
    });
  }, []);

  useEffect(() => {
    console.log("Latest allSamples:", allSamples);
    // Trigger the updated playback sequence
    //  in useAudioPlayback when allSamples are updated
    updateSequnce(allSamples, (60 / bpm) * 4); 
  }, [allSamples]); 

  const handleClearLoop = () => {
    setAllSamples([]);
  };

  const bpm = 120;
  const measurePerSecond = (60 / bpm) * 4;
  const PixelsPerSecond = trackWidth / measurePerSecond;
  const trackLeft = Math.floor(trackRef?.current?.getBoundingClientRect().left);

  return (
    <div>
      <div className='track-status'>
        <span>
          width: {trackWidth}px 
        </span>
        <span>
          bpm: {bpm} 
        </span>
        <span>
          loop seconds: {measurePerSecond} secs
        </span>
        <span>
          left = {trackLeft}
        </span>
        <span>
          pixels ps = {PixelsPerSecond} 
        </span>
      </div>
      {tracks.map((track, index) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          sampleSelected={sampleSelected}
          trackRef={trackRef}
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
