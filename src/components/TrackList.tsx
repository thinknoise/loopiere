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
import useTrackWidth from "../hooks/useTrackWidth";
import useAudioPlayback, { PlaybackSample } from "../hooks/useAudioPlayback";
import useTrackSequence from "../hooks/useTrackSequence";
import useTransport from "../hooks/useTransport";
import { useRecorder, UseRecorderResult } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { startPlayback, stopPlayback } from "../utils/audioPlaybackManager";

import { type SampleDescriptor } from "../utils/audioManager";
import { type UpdateSamplePositionFn } from "../types/sample";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import {
  saveSequence,
  loadSequence,
  deleteSequence,
  clearSamples,
  changeBpm,
} from "../utils/loopStateManager";

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

  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // sequencing hook
  const {
    allSamples,
    setAllSamples,
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
    playNow(getPlacedSamples(), bpm, trackAudioState)
  );

  // tracks to render & preload
  const tracks = useMemo<TrackInfo[]>(
    () => generateTracks(trackNumber),
    [trackNumber]
  );

  // grouped callbacks passed to LoopControls
  const actions = useMemo(() => {
    return {
      onStart: async () =>
        startPlayback({
          allSamples,
          tracks,
          bpm,
          getPlacedSamples,
          playNow,
          stop,
          stopAll,
          start,
          trackAudioState,
        }),
      onStop: () => stopPlayback({ stop, stopAll }),
      onClear: () => {
        stop();
        stopAll();
        clearSamples(setAllSamples);
      },
      onSave: () => saveSequence(allSamples, bpm),
      onDelete: () => deleteSequence(setAllSamples, setBpm, initialBpm),
      onLoad: () => loadSequence(setAllSamples, setBpm),
      onBpmChange: (event: Event, value: number | number[]) =>
        changeBpm(setBpm, value),
    };
  }, [
    allSamples,
    bpm,
    getPlacedSamples,
    initialBpm,
    playNow,
    setAllSamples,
    start,
    stop,
    stopAll,
    tracks,
  ]);

  // derived metrics
  const secsPerLoop = useMemo<number>(() => bpmToSecondsPerLoop(bpm), [bpm]);
  // shared reference to your filters
  const trackFiltersRef = useRef<Map<number, BiquadFilterNode>>(new Map());
  const [trackFrequencies, setTrackFrequencies] = useState<
    Record<number, number>
  >({});
  const trackAudioState = {
    filters: trackFiltersRef,
    frequencies: trackFrequencies,
  };

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
          trackFiltersRef={trackFiltersRef}
          trackFrequencies={trackFrequencies}
          setTrackFrequencies={setTrackFrequencies}
          trackInfo={track}
          trackWidth={trackWidth}
          trackLeft={trackLeft}
          bpm={bpm}
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
          editSampleOfSamples={editSampleOfSamples}
          updateSamplesWithNewPosition={updateSamplesWithNewPosition}
          selected={track.id === selectedTrackId}
          onSelect={() =>
            setSelectedTrackId((prev) => (prev === track.id ? null : track.id))
          }
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
