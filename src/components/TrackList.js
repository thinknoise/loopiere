import React, { useState, useCallback, useEffect, useRef } from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';
import useAudioPlayback from '../hooks/useAudioPlayback'; // Import the custom hook
import '../style/tracklist.css';

import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

const generateTracks = (trackNumber) => {
  return Array.from({ length: trackNumber }, (_, index) => ({
    id: index + 1,
    name: `Track ${index + 1}`,
    xPos: 0,
    xDragOffset: 0,
    samples: []
  }));
};




export const RiveDemo = () => {
  const { RiveComponent } = useRive({
    // Load a local riv `clean_the_car.riv` or upload your own!
    src: "/play_button2.riv",
    // Be sure to specify the correct state machine (or animation) name
    stateMachines: "Motion",
    // This is optional.Provides additional layout control.
    layout: new Layout({
      fit: Fit.Contain, // Change to: rive.Fit.Contain, or Cover
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  return <RiveComponent />;
};





const TrackList = ({ trackNumber, sampleSelected }) => {
  const [trackWidth, trackRef] = useTrackWidth();
  const [allSamples, setAllSamples] = useState([]);
  const [bpm, setBPM] = useState(90);
  const bpmSlisderRef = useRef(bpm)

  const { playAudioSet, handleStopAllSamples, updateSequnce } = useAudioPlayback(); // Use the audio playback hook

  const tracks = generateTracks(trackNumber);

  // Memoize the updateAllSamples function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((newSample, removeSample = false) => {
    setAllSamples((prevAllSamples) => {
      if (removeSample) {
        // filter out the "newSample" 
        const filteredSamples = prevAllSamples.filter((sample => sample.trackSampleId !== newSample.trackSampleId)); 
        return [...filteredSamples];
      } else {
        return [...prevAllSamples, newSample];
      }
    });
  }, []);

  useEffect(() => {
    // Trigger the updated playback sequence in useAudioPlayback when allSamples are updated
    updateSequnce(allSamples, (60 / bpm) * 4); 
    // console.log("Latest allSamples:", allSamples);
  }, [allSamples, bpm, updateSequnce]); // Add updateSequnce as a dependency to useEffect

  const handleClearLoop = () => {
    setAllSamples([]);
  };

  const updateSliderValue = (e) => {
    setBPM(e.target.value);
  }

  const measurePerSecond = (60 / bpm) * 4;
  const PixelsPerSecond = trackWidth / measurePerSecond;
  const trackLeft = Math.floor(trackRef?.current?.getBoundingClientRect().left);

  return (
    <div>
            {/* Button to play all samples */}
      <div className="RiveContainer">
      <RiveDemo />
        {/* <UrlDemo /> */}
      </div>
      <button className='play' onClick={() => playAudioSet(allSamples, 2.2)}>Play Tracks</button>
      <button className='stop' onClick={handleStopAllSamples}>Stop</button>
      <button className='clear' onClick={handleClearLoop}>Clear Loop</button>
      <br/>
      <input 
        ref={bpmSlisderRef} 
        type="range" 
        id="slider" 
        name="slider" 
        min="40" 
        max="200" 
        value={bpm}
        onInput={(e) => updateSliderValue(e)}
      />

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
      {tracks.map((track) => (
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

    </div>
  );
};

export default TrackList;
