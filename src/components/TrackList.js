import React, { useState, useRef } from 'react';
import Track from './Track';
import { saveAllSamplesToLocalStorage, getAllSamplesFromLocalStorage } from '../utils/storageUtils';
import useTrackWidth from '../hooks/useTrackWidth';
import useAudioPlayback from '../hooks/useAudioPlayback'; // Import the custom hook
import useTrackSequence from '../hooks/useTrackSequence';
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
  const [ isListingSelected, setListingSelected ] = useState(false)
  const trackRef = useRef(null)
  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

  const tracks = generateTracks(trackNumber);

  const { playAudioSet, handleStopAllSamples } = useAudioPlayback();

  const {
    allSamples,
    latestSamplesRef,
    bpm,
    latestBpm,
    setBPM,
    saveSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  } = useTrackSequence(80)

  const updateSliderValue = (e) => {
    setBPM(e.target.value);
  }

  const secsPerMeasure = (60 / latestBpm.current) * 4;
  const PixelsPerSecond = trackWidth / secsPerMeasure;

  return (
    <div>
      <button className='play' onClick={() => playAudioSet(latestSamplesRef, latestBpm)}>Play Tracks</button>
      <button className='stop' onClick={handleStopAllSamples}>Stop</button>
      <button className='clear' onClick={clearAllSamples}>Clear Loop</button>
      <br/>
      <button className='save-sequence' onClick={() => saveSequence(latestBpm.current, bpm)}>Save Loop</button>
      <button className='unsave-sequence' onClick={() => saveAllSamplesToLocalStorage([], 80)}>Delete Saved Loop</button>
      <button className='load-sequence' onClick={() => {
        const savedSamples = getAllSamplesFromLocalStorage();
        setAllSamples(savedSamples)
      }}>Load Saved Loop</button>

      <br/>
      <input 
        ref={latestBpm} 
        className='bpm-slider'
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
          loop seconds: {Math.round(secsPerMeasure * 100)/100} secs
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
          trackWidth={trackWidth}
          trackLeft={trackLeft}
          bpm={bpm}
          editSampleOfSamples={editSampleOfSamples} // Pass the memoized add to allSamples function
          updateSamplesWithNewPosition={updateSamplesWithNewPosition} 
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
        />
      ))}

      {/* Display samples in loop in lower left */}
      <div 
        className={`track-sample-listing ${isListingSelected ? 'selected' : ''}`}
        onClick={() => setListingSelected(!isListingSelected)}
      >
        <h3>Track Samples:</h3>
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
