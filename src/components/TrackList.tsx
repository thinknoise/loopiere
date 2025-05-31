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
import useTrackSequence from "../hooks/useTrackSequence";
import { useRecorder, UseRecorderResult } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { useLoopSettings } from "../context/LoopSettingsContext";
import { useLoopPlayback } from "../hooks/useLoopPlayback"; // NEW

import type { SampleDescriptor } from "../utils/audioManager";
import type { PlaybackSample } from "../types/playback"; // NEW
import type { TrackAudioState } from "../types/audio"; // NEW
import type { UpdateSamplePositionFn } from "../types/sample";
import { bpmToSecondsPerLoop } from "../utils/timeHelpers";
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
  // record hook
  const audioContext = useAudioContext();

  // listing toggle
  const [isListingSelected, setListingSelected] = useState<boolean>(false);

  // ref to a track container (passed into each <Track />)
  const trackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null!);

  // BPM state
  const { bpm, setBpm, beatsPerLoop, setBeatsPerLoop } = useLoopSettings();

  // measure width & left offset
  const [trackWidth, trackLeft] = useTrackWidth(trackRef, beatsPerLoop);

  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // Frequency filters stateq
  const trackFiltersRef = useRef<Map<string, AudioNode>>(new Map());

  const [trackFrequencies, setTrackFrequencies] = useState<
    Record<number, number>
  >({});

  const [trackHighpassFrequencies, setTrackHighpassFrequencies] = useState<
    Record<number, number>
  >({});

  const [trackGains, setTrackGains] = useState<Record<number, number>>({});
  const [trackPans, setTrackPans] = useState<Record<number, number>>({});

  // sequencing hook
  const {
    allSamples,
    setAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  } = useTrackSequence(bpm);

  const getPlacedSamples = useCallback(
    (): PlaybackSample[] =>
      allSamples.filter((s): s is PlaybackSample => typeof s.xPos === "number"),
    [allSamples]
  );

  // tracks to render & preload
  const tracks = useMemo<TrackInfo[]>(
    () => generateTracks(trackNumber),
    [trackNumber]
  );

  const trackAudioState = useMemo(
    () => ({
      filters: trackFiltersRef,
      frequencies: trackFrequencies,
      highpassFrequencies: trackHighpassFrequencies,
      gains: trackGains,
      pans: trackPans,
    }),
    [trackFrequencies, trackHighpassFrequencies, trackGains, trackPans]
  );

  const { startLoop, stopLoop, isPlaying } = useLoopPlayback(
    getPlacedSamples(), // pass only the “placed” samples
    trackAudioState
  );

  // grouped callbacks passed to LoopControls
  const actions = useMemo(() => {
    return {
      onStart: () => {
        startLoop();
      },
      onStop: () => {
        stopLoop();
      },
      onClear: () => {
        stopLoop();
        clearSamples(setAllSamples);
      },
      onSave: () => saveSequence(allSamples, bpm, beatsPerLoop),
      onDelete: () =>
        deleteSequence(setAllSamples, setBpm, initialBpm, beatsPerLoop),
      onLoad: () => loadSequence(setAllSamples, setBpm, setBeatsPerLoop),
      onBpmChange: (event: Event, value: number | number[]) =>
        changeBpm(setBpm, value),
    };
  }, [
    allSamples,
    bpm,
    beatsPerLoop,
    initialBpm,
    startLoop,
    stopLoop,
    setAllSamples,
    setBeatsPerLoop,
    setBpm,
  ]);

  // derived metrics
  const secsPerLoop = useMemo<number>(
    () => bpmToSecondsPerLoop(bpm, beatsPerLoop),
    [bpm, beatsPerLoop]
  );

  /// Recording
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

  useEffect(() => {
    tracks.forEach((track) => {
      const tid = track.id;
      if (!trackFiltersRef.current.has(`${tid}_gain`)) {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1;
        trackFiltersRef.current.set(`${tid}_gain`, gainNode);
      }
      if (!trackFiltersRef.current.has(`${tid}_pan`)) {
        const panNode = audioContext.createStereoPanner();
        panNode.pan.value = 0;
        trackFiltersRef.current.set(`${tid}_pan`, panNode);
      }
      // Low‐pass filter:
      if (!trackFiltersRef.current.has(`${tid}_lowpass`)) {
        const lowF = audioContext.createBiquadFilter();
        lowF.type = "lowpass";
        // default: open fully
        lowF.frequency.value = audioContext.sampleRate / 2;
        trackFiltersRef.current.set(`${tid}_lowpass`, lowF);
      }
      // High‐pass filter:
      if (!trackFiltersRef.current.has(`${tid}_highpass`)) {
        const highF = audioContext.createBiquadFilter();
        highF.type = "highpass";
        // default: open fully
        highF.frequency.value = 0;
        trackFiltersRef.current.set(`${tid}_highpass`, highF);
      }
    });
  }, []);

  // // stop playback when beatsPerLoop changes
  // useEffect(() => {
  //   stopLoop();
  // }, [beatsPerLoop, stopLoop]);

  return (
    <div>
      <LoopControls
        sliderRef={null}
        {...actions}
        bpm={bpm}
        beatsPerLoop={beatsPerLoop}
        onBeatsPerLoopChange={(val) => setBeatsPerLoop(val)}
        trackWidth={trackWidth}
        secsPerLoop={secsPerLoop}
        emptyTracks={allSamples.length === 0}
        isPlaying={isPlaying}
      />

      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackAudioState={trackAudioState}
          setTrackFrequencies={setTrackFrequencies}
          setTrackHighpassFrequencies={setTrackHighpassFrequencies}
          trackInfo={track}
          trackWidth={trackWidth}
          trackLeft={trackLeft}
          bpm={bpm}
          beatsPerLoop={beatsPerLoop}
          allSamples={allSamples.filter((s) => s.trackId === track.id)}
          editSampleOfSamples={editSampleOfSamples}
          updateSamplesWithNewPosition={updateSamplesWithNewPosition}
          selected={track.id === selectedTrackId}
          onSelect={() =>
            setSelectedTrackId((prev) => (prev === track.id ? null : track.id))
          }
          setTrackGains={setTrackGains}
          setTrackPans={setTrackPans}
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
