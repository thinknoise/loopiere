import React, { useState, useCallback, useEffect, useRef } from 'react';
import Track from './Track';
import useTrackWidth from '../hooks/useTrackWidth';
import useAudioPlayback from '../hooks/useAudioPlayback'; // Import the custom hook
import '../style/tracklist.css';

// import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

const generateTracks = (trackNumber) => {
  return Array.from({ length: trackNumber }, (_, index) => ({
    id: index + 1,
    name: `Track ${index + 1}`,
    xPos: 0,
    xDragOffset: 0,
    samples: []
  }));
};




// export const RiveDemo = () => {
//   const { RiveComponent } = useRive({
//     // Load a local riv `clean_the_car.riv` or upload your own!
//     src: "/play_button.riv",
//     layout: new Layout({
//       fit: Fit.Contain, // Change to: rive.Fit.Contain, or Cover
//       alignment: Alignment.Center,
//     }),
//     autoplay: true,
//     onLoop: 'stop',
//   });

//   return <RiveComponent />;
// };





const TrackList = ({ trackNumber, sampleSelected }) => {
  const [trackWidth, trackRef] = useTrackWidth();
  const [allSamples, setAllSamples] = useState([]);
  const [bpm, setBPM] = useState(90);
  const bpmSlisderRef = useRef(bpm)

  const { playAudioSet, handleStopAllSamples, updateSequence } = useAudioPlayback(); // Use the audio playback hook

  const tracks = generateTracks(trackNumber);

  // Memoize the updateAllSamples function to prevent unnecessary re-renders
  const updateAllSamples = useCallback((newSample, removeSample = false) => {
    setAllSamples((prevAllSamples) => {
      if (removeSample) {
        // filter out the "newSample" 
        const filteredSamples = prevAllSamples.filter((sample => {
          // console.log(sample.trackSampleId, newSample.trackSampleId)
          return sample.trackSampleId !== newSample.trackSampleId
        })); 
        // console.log('filtered', filteredSamples, typeof filteredSamples)

        return filteredSamples;
      } else {
        // console.log( typeof prevAllSamples, [...prevAllSamples, newSample] )

        return [...prevAllSamples, newSample];
      }
    });
  }, []);

  const updateSamplesWithNewPosition = useCallback((trackSampleId, newPosition) => {
    setAllSamples((prevAllSamples) => {
      return prevAllSamples.map(sample => 
        sample.trackSampleId === trackSampleId 
          ? { ...sample, xPos: newPosition }  // Update the xPos of the matched sample
          : sample  // Keep other samples unchanged
      );
    });
  })


  // SEQUENCE

  useEffect(() => {
    // Trigger the updated playback sequence in useAudioPlayback when allSamples are updated
    updateSequence(allSamples, (60 / bpm) * 4); 
    // console.log("Latest allSamples:", allSamples);
  }, [allSamples, bpm, updateSequence]); // Add updateSequence as a dependency to useEffect

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
        {/* <RiveDemo /> */}
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
          loop seconds: {Math.round(measurePerSecond * 100)/100} secs
        </span>
        <span>
          left = {trackLeft}
        </span>
        <span>
          pixels ps = {Math.round(PixelsPerSecond)} 
        </span>
      </div>
      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          sampleSelected={sampleSelected}
          trackRef={trackRef}
          bpm={bpm}
          updateAllSamples={updateAllSamples} // Pass the memoized add to allSamples function
          updateSamplesWithNewPosition={updateSamplesWithNewPosition} 
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
        />
      ))}

      {/* Display samples in loop in lower left */}
      <div className='track-sample-listing'>
        <h3>All Consolidated Samples:</h3>
        {allSamples.map((sample) => {
          return (
            <pre key={sample.trackSampleId}>{sample.trackSampleId} - {sample.filename}</pre>
          )
        })}
      </div>

    </div>
  );
};

export default TrackList;
