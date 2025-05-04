// TrackList.js
import React, { useState, useRef, useEffect } from "react";
import Track from "./Track";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "../utils/storageUtils";
import useTrackWidth from "../hooks/useTrackWidth";
import useAudioPlayback from "../hooks/useAudioPlayback";
import useTrackSequence from "../hooks/useTrackSequence";
import useTransport from "../hooks/useTransport";
import { useRecorder } from "../hooks/useRecorder";
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
  const [recordedSamples, setRecordedSamples] = useState([]);

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

        if (!url && !sample.buffer) {
          console.warn(
            "[prepareAllTracks] Sample is missing 'path', 'url', and has no buffer:",
            sample
          );
          continue;
        }

        if (!sample.buffer) {
          if (!url) {
            console.warn(
              "[prepareAllTracks] Skipping sample with no URL or buffer:",
              sample
            );
            continue;
          }

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
  const audioContext = getAudioContext();
  const { startRecording, stopRecording, isRecording, audioBuffer } =
    useRecorder(audioContext);
  // recording stuff
  useEffect(() => {
    if (!audioBuffer) return;

    // Decide where to place it (e.g., Track 1, start at 0)
    const newSample = {
      id: Date.now(), // unique ID
      trackId: 1, // or whichever is selected
      buffer: audioBuffer,
      url: null, // it's not from a file
      startTime: 0, // place at the beginning
      duration: audioBuffer.duration,
      filename: "Live Recording",
      path: null,
    };

    setAllSamples((prev) => [...prev, newSample]);
  }, [audioBuffer, setAllSamples]);

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
