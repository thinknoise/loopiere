// src/components/TrackList.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  FC,
  RefObject,
} from "react";
import LoopControls from "./LoopControls";
import Track from "./Track";
import useTrackWidth from "../hooks/useTrackWidth";
import { useRecorder, UseRecorderResult } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { useTrackSampleStore } from "../stores/trackSampleStore";

import type { TrackSample } from "../types/audio";

import "../style/tracklist.css";

// --- Types ---
export interface TrackInfo {
  id: number;
  name: string;
}

// --- # of Tracks Helpers ---
const generateTracks = (n: number): TrackInfo[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Track ${i + 1}` }));

// --- Component ---
const TrackList: FC = () => {
  const trackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null!);

  const [trackNumber, setTrackNumber] = useState(4);

  const [isListingSelected, setListingSelected] = useState<boolean>(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

  const trackFiltersRef = useRef<Map<string, AudioNode>>(new Map());
  const [trackFrequencies, setTrackFrequencies] = useState<
    Record<number, number>
  >({});
  const [trackHighpassFrequencies, setTrackHighpassFrequencies] = useState<
    Record<number, number>
  >({});

  const [trackBypasses, setTrackBypasses] = useState<{
    lowpass: Record<number, boolean>;
    highpass: Record<number, boolean>;
  }>({
    lowpass: {},
    highpass: {},
  });

  const [trackGains, setTrackGains] = useState<Record<number, number>>({});
  const [trackPans, setTrackPans] = useState<Record<number, number>>({});

  const allSamples = useTrackSampleStore((s) => s.allSamples);
  const setAllSamples = useTrackSampleStore((s) => s.setAllSamples);

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
      bypasses: trackBypasses,
    }),
    [
      trackFrequencies,
      trackHighpassFrequencies,
      trackGains,
      trackPans,
      trackBypasses,
    ]
  );

  const audioContext = useAudioContext();
  const { audioBuffer }: UseRecorderResult = useRecorder(audioContext);

  // maybe this goes in record component
  useEffect(() => {
    if (!audioBuffer) return;
    const date = new Date().toISOString().slice(0, 10);
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
    const prev = useTrackSampleStore.getState().allSamples;
    setAllSamples([...prev, newSample]);
  }, [audioBuffer, setAllSamples]);

  useEffect(() => {
    tracks.forEach((track) => {
      setTrackBypasses((prev) => ({
        lowpass: {
          ...prev.lowpass,
          [track.id]: prev.lowpass[track.id] ?? false,
        },
        highpass: {
          ...prev.highpass,
          [track.id]: prev.highpass[track.id] ?? false,
        },
      }));
    });
  }, [tracks]);

  return (
    <div>
      <LoopControls
        sliderRef={null}
        trackWidth={trackWidth}
        trackAudioState={trackAudioState}
        trackNumber={trackNumber}
        setTrackNumber={setTrackNumber}
      />

      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackAudioState={trackAudioState}
          setTrackFrequencies={setTrackFrequencies}
          setTrackHighpassFrequencies={setTrackHighpassFrequencies}
          setTrackBypasses={setTrackBypasses}
          trackInfo={track}
          trackWidth={trackWidth}
          trackLeft={trackLeft}
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

      <div className="track-add-remove">
        <button onClick={() => setTrackNumber((n: number) => n + 1)}>+</button>
        <button onClick={() => setTrackNumber((n: number) => n - 1)}>-</button>
      </div>
    </div>
  );
};

export default TrackList;
