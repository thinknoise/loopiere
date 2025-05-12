// src/components/TrackList.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  FC,
  RefObject,
  useCallback,
} from "react";
import LoopControls from "./LoopControls";
import Track from "./Track";
import {
  saveAllSamplesToLocalStorage,
  getAllSamplesFromLocalStorage,
} from "../utils/storageUtils";
import useTrackWidth from "../hooks/useTrackWidth";
import useAudioPlayback, { PlaybackSample } from "../hooks/useAudioPlayback";
import useTrackSequence from "../hooks/useTrackSequence";
import useTransport from "../hooks/useTransport";
import { useRecorder, UseRecorderResult } from "../hooks/useRecorder";
import { prepareAllTracks } from "../utils/audioManager";
import { useAudioContext } from "./AudioContextProvider";
import { resumeAudioContext } from "../utils/audioContextSetup";

import { type SampleDescriptor } from "../utils/audioManager";
import { type UpdateSamplePositionFn } from "../types/sample";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import "../style/tracklist.css";

// --- Types ---
export interface TrackInfo {
  id: number;
  name: string;
}

export interface TrackListProps {
  trackNumber?: number;
  initialBpm?: number;
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
}

// --- Helpers ---
const generateTracks = (n: number): TrackInfo[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Track ${i + 1}` }));

// --- Component ---
const TrackList: FC<TrackListProps> = ({
  trackNumber = 4,
  initialBpm = 80,
}) => {
  // listing toggle
  const [isListingSelected, setListingSelected] = useState<boolean>(false);

  // ref to a track container (passed into each <Track />)
  const trackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null!);

  // measure width & left offset
  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

  // BPM state
  const [bpm, setBpm] = useState<number>(initialBpm);

  // sequencing hook
  const {
    allSamples,
    saveSequence,
    setAllSamples,
    clearAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  } = useTrackSequence(bpm);

  // playback & transport
  const { playNow, stopAll } = useAudioPlayback();

  const getPlacedSamples = useCallback(
    (): PlaybackSample[] =>
      allSamples.filter((s): s is PlaybackSample => typeof s.xPos === "number"),
    [allSamples]
  );

  const { start, stop } = useTransport(bpm, () =>
    playNow(getPlacedSamples(), bpm)
  );

  // tracks to render & preload
  const tracks = useMemo<TrackInfo[]>(
    () => generateTracks(trackNumber),
    [trackNumber]
  );

  // grouped callbacks passed to LoopControls
  const actions = useMemo(() => {
    return {
      onStart: async (): Promise<void> => {
        stop();
        stopAll();
        await prepareAllTracks(allSamples, tracks);
        resumeAudioContext();
        const placed = getPlacedSamples();
        await prepareAllTracks(placed, tracks);
        start();
        playNow(placed, bpm);
      },
      onStop: (): void => {
        stop();
        stopAll();
      },
      onClear: (): void => {
        stop();
        stopAll();
        clearAllSamples();
      },
      onSave: (): void => saveSequence(),
      onDelete: (): void => saveAllSamplesToLocalStorage([], initialBpm),
      onLoad: async (): Promise<void> => {
        const audioContext = new AudioContext(); // or new AudioContext()
        const restored = await getAllSamplesFromLocalStorage(audioContext);
        setAllSamples(restored);
        const stored = Number(localStorage.getItem("LoopiereBPM"));
        if (!isNaN(stored)) setBpm(stored);
      },
      onBpmChange: (event: Event, value: number | number[]): void => {
        if (typeof value === "number") {
          setBpm(value);
        } else {
          setBpm(value[88]);
        }
      },
    };
  }, [
    stop,
    stopAll,
    allSamples,
    tracks,
    getPlacedSamples,
    start,
    playNow,
    bpm,
    clearAllSamples,
    saveSequence,
    initialBpm,
    setAllSamples,
  ]);

  // derived metrics
  const secsPerLoop = useMemo<number>(() => bpmToSecondsPerLoop(bpm), [bpm]);

  // record hook
  const audioContext = useAudioContext();
  const { audioBuffer }: UseRecorderResult = useRecorder(audioContext);
  useEffect(() => {
    if (!audioBuffer) return;
    const newSample: SampleDescriptor = {
      id: Date.now(),
      trackId: 1,
      buffer: audioBuffer,
      url: null,
      path: null,
      startTime: 0,
      duration: audioBuffer.duration,
      filename: "Live Recording",
      xPos: 0,
    };
    setAllSamples((prev) => [...prev, newSample]);
  }, [audioBuffer, setAllSamples]);

  return (
    <div>
      <LoopControls
        sliderRef={null}
        {...actions}
        bpm={bpm}
        trackWidth={trackWidth}
        secsPerLoop={secsPerLoop}
        emptyTracks={allSamples.length === 0}
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
          <pre key={sample.id}>{sample.filename}</pre>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
