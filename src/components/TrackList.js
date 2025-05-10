// TrackList.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import LoopControls from "./LoopControls";
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
import { prepareAllTracks } from "../utils/audioManager";
import { useAudioContext } from "./AudioContextProvider";
import { resumeAudioContext } from "../utils/audioContextSetup";

import { bpmToSecondsPerLoop, getPixelsPerSecond } from "../utils/timingUtils";
import "../style/tracklist.css";

const generateTracks = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Track ${i + 1}` }));

const TrackList = ({ trackNumber = 4, initialBpm = 80 }) => {
  const [isListingSelected, setListingSelected] = useState(false);
  const trackRef = useRef(null);
  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

  // BPM state
  const [bpm, setBpm] = useState(initialBpm);

  const {
    allSamples,
    saveSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  } = useTrackSequence(bpm);

  const { playNow, stopAll } = useAudioPlayback();
  const { start, stop } = useTransport(bpm, () => playNow(allSamples, bpm));

  // tracks used by prepareAllTracks and rendering
  const tracks = useMemo(() => generateTracks(trackNumber), [trackNumber]);

  // grouped action callbacks
  const actions = useMemo(
    () => ({
      onStart: async () => {
        stop();
        stopAll();
        await prepareAllTracks();
        resumeAudioContext();
        playNow(allSamples, bpm);
        console.log(allSamples);
        start();
      },
      onStop: () => {
        stop();
        stopAll();
      },
      onClear: () => {
        stop();
        stopAll();
        clearAllSamples();
      },
      onSave: () => saveSequence(bpm),
      onDelete: () => saveAllSamplesToLocalStorage([], initialBpm),
      onLoad: async () => {
        const audioContext = new AudioContext();
        const restored = await getAllSamplesFromLocalStorage(audioContext);
        setAllSamples(restored);
        const storedBpm = Number(localStorage.getItem("LoopiereBPM"));
        if (!isNaN(storedBpm)) {
          setBpm(storedBpm);
        }
      },
      onBpmChange: (e) => setBpm(parseInt(e.target.value, 10)),
    }),
    [
      stop,
      stopAll,
      playNow,
      allSamples,
      bpm,
      start,
      clearAllSamples,
      saveSequence,
      setAllSamples,
      setBpm,
      initialBpm,
    ]
  );

  const secsPerLoop = useMemo(() => bpmToSecondsPerLoop(bpm), [bpm]);

  const pixelsPerSecond = useMemo(
    () => Math.round(getPixelsPerSecond(trackWidth, bpm)),
    [trackWidth, bpm]
  );

  // recording context & effect
  const audioContext = useAudioContext();
  const { audioBuffer } = useRecorder(audioContext);
  useEffect(() => {
    if (!audioBuffer) return;
    const newSample = {
      id: Date.now(),
      trackId: 1,
      buffer: audioBuffer,
      url: null,
      startTime: 0,
      duration: audioBuffer.duration,
      filename: "Live Recording",
      path: null,
    };
    setAllSamples((prev) => [...prev, newSample]);
  }, [audioBuffer, setAllSamples]);

  return (
    <div>
      <LoopControls
        {...actions}
        bpm={bpm}
        trackWidth={trackWidth}
        secsPerLoop={secsPerLoop}
        trackLeft={trackLeft}
        pixelsPerSecond={pixelsPerSecond}
      />

      {tracks.map((track) => (
        <Track
          key={track.id}
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
