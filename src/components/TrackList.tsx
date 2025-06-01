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
import { useLoopSettings } from "../context/LoopSettingsContext";

import type { TrackSample } from "../types/audio";
import { type UpdateSamplePositionFn } from "../types/audio";
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
  const [isListingSelected, setListingSelected] = useState<boolean>(false);
  const trackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null!);
  const { bpm, setBpm, beatsPerLoop, setBeatsPerLoop } = useLoopSettings();
  const [trackWidth, trackLeft] = useTrackWidth(trackRef, beatsPerLoop);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const trackFiltersRef = useRef<Map<string, AudioNode>>(new Map());
  const [trackFrequencies, setTrackFrequencies] = useState<
    Record<number, number>
  >({});
  const [trackHighpassFrequencies, setTrackHighpassFrequencies] = useState<
    Record<number, number>
  >({});
  const [trackGains, setTrackGains] = useState<Record<number, number>>({});
  const [trackPans, setTrackPans] = useState<Record<number, number>>({});

  const {
    allSamples,
    setAllSamples,
    editSampleOfSamples,
    updateSamplesWithNewPosition,
  } = useTrackSequence(bpm);

  const { playNow, stopAll } = useAudioPlayback({ bpm, beatsPerLoop });
  const { start, stop } = useTransport(bpm, beatsPerLoop, () =>
    playNow(getPlacedSamples(), bpm, trackAudioState)
  );

  const getPlacedSamples = useCallback(
    (): PlaybackSample[] =>
      allSamples.filter((s): s is PlaybackSample => typeof s.xPos === "number"),
    [allSamples]
  );

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
      onSave: () => saveSequence(allSamples, bpm, beatsPerLoop),
      onDelete: () =>
        deleteSequence(setAllSamples, setBpm, initialBpm, beatsPerLoop),
      onLoad: () => loadSequence(setAllSamples, setBpm, setBeatsPerLoop),
      onBpmChange: (event: Event, value: number | number[]) =>
        changeBpm(setBpm, value),
    };
  }, [
    allSamples,
    beatsPerLoop,
    bpm,
    getPlacedSamples,
    initialBpm,
    playNow,
    setAllSamples,
    setBeatsPerLoop,
    setBpm,
    start,
    stop,
    stopAll,
    trackAudioState,
    tracks,
  ]);

  const secsPerLoop = useMemo<number>(
    () => bpmToSecondsPerLoop(bpm, beatsPerLoop),
    [bpm, beatsPerLoop]
  );

  const audioContext = useAudioContext();
  const { audioBuffer }: UseRecorderResult = useRecorder(audioContext);
  useEffect(() => {
    if (!audioBuffer) return;
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const newSample: TrackSample = {
      id: Date.now(),
      type: "recording",
      blobUrl: "",
      filename: "Live Recording",
      title: `Live Recording ${date}`,
      duration: audioBuffer.duration,
      trimStart: 0,
      trimEnd: audioBuffer.duration,
      buffer: audioBuffer,
      blob: new Blob(),
      recordedAt: new Date(),
      trackId: 1,
      xPos: 0,
      onTrack: true,
    };
    setAllSamples((prev) => [...prev, newSample]);
  }, [audioBuffer, setAllSamples]);

  useEffect(() => {
    stop();
    stopAll();
    // only stop when beatsPerLoop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatsPerLoop]);

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
