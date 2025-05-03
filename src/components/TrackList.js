// TrackList.js
import React, { useState, useRef } from "react";
import Track from "./Track";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "../utils/storageUtils";
import useTrackWidth from "../hooks/useTrackWidth";
import useAudioPlayback from "../hooks/useAudioPlayback";
import useTrackSequence from "../hooks/useTrackSequence";
import useTransport from "../hooks/useTransport";

import { getAudioContext, loadAudio } from "../utils/audioManager";
import { bpmToSecondsPerLoop, getPixelsPerSecond } from "../utils/timingUtils";
import "../style/tracklist.css";

const generateTracks = (trackNumber) => {
  return Array.from({ length: trackNumber }, (_, index) => ({
    id: index + 1,
    name: `Track ${index + 1}`,
  }));
};

const TrackList = ({ trackNumber = 4 }) => {
  const [isListingSelected, setListingSelected] = useState(false);
  const trackRef = useRef(null);
  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

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
  } = useTrackSequence(80);

  const onLoop = () => {
    playNow(latestSamplesRef.current, latestBpm.current);
  };

  const { start, stop } = useTransport(bpm, onLoop);

  const { playNow, stopAll } = useAudioPlayback();

  const prepareAllTracks = async () => {
    const samplesByTrackId = allSamples.reduce((acc, sample) => {
      if (!acc[sample.trackId]) acc[sample.trackId] = [];
      acc[sample.trackId].push(sample);
      return acc;
    }, {});

    for (const track of tracks) {
      const samples = samplesByTrackId[track.id] || [];

      for (const sample of samples) {
        const url =
          sample.url || (sample.path ? `/samples/${sample.path}` : null);

        if (!url) {
          console.warn(
            "[prepareAllTracks] Sample is missing 'path' or 'url':",
            sample
          );
          continue;
        }

        if (!sample.buffer) {
          try {
            const buffer = await loadAudio(url);
            sample.buffer = buffer;
            sample.url = url; // cache for next time
          } catch (err) {
            console.error(
              "[prepareAllTracks] Failed to load sample:",
              url,
              err
            );
          }
        }
      }
    }
  };

  const handleStart = async () => {
    // wait for all decoding to complete
    await prepareAllTracks();

    const context = getAudioContext();
    await context.resume();

    onLoop();
    start();
  };

  const updateSliderValue = (e) => {
    setBPM(parseInt(e.target.value));
  };

  const secsPerMeasure = bpmToSecondsPerLoop(latestBpm.current);
  const PixelsPerSecond = getPixelsPerSecond(trackWidth, latestBpm.current);

  const tracks = generateTracks(trackNumber);

  return (
    <div>
      <div className="button-group">
        <button className="play" onClick={handleStart}>
          Play Tracks
        </button>
        <button
          className="stop"
          onClick={() => {
            stop();
            stopAll();
          }}
        >
          Stop
        </button>
        <button className="clear" onClick={clearAllSamples}>
          Clear Loop
        </button>
        <br />
        <button
          className="save-sequence"
          onClick={() => saveSequence(latestBpm.current, bpm)}
        >
          Save Loop
        </button>
        <button
          className="unsave-sequence"
          onClick={() => saveAllSamplesToLocalStorage([], 80)}
        >
          Delete Saved Loop
        </button>
        <button
          className="load-sequence"
          onClick={() => {
            const savedSamples = getAllSamplesFromLocalStorage();
            setAllSamples(savedSamples);
          }}
        >
          Load Saved Loop
        </button>
      </div>

      <br />
      <input
        ref={latestBpm}
        className="bpm-slider"
        type="range"
        id="slider"
        name="slider"
        min="40"
        max="200"
        value={bpm}
        onInput={updateSliderValue}
      />

      <div className="track-status">
        <span>width: {trackWidth}px</span>
        <span>bpm: {bpm}</span>
        <span>loop seconds: {Math.round(secsPerMeasure * 100) / 100} secs</span>
        <span>left = {trackLeft}</span>
        <span>pixels ps = {Math.round(PixelsPerSecond)}</span>
      </div>

      {tracks.map((track, index) => (
        <Track
          key={track.id || index}
          ref={trackRef}
          trackInfo={track}
          trackWidth={trackWidth}
          trackLeft={trackLeft}
          bpm={bpm}
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
          editSampleOfSamples={editSampleOfSamples}
          updateSamplesWithNewPosition={updateSamplesWithNewPosition}
        />
      ))}

      <div
        className={`track-sample-listing ${
          isListingSelected ? "selected" : ""
        }`}
        onClick={() => setListingSelected(!isListingSelected)}
      >
        <h3>Track Samples:</h3>
        {allSamples.map((sample) => (
          <pre key={sample.id}>
            {sample.id} - {sample.filename}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
