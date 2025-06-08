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
import { TrackAudioStateProvider } from "../context/TrackAudioStateContext";

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

  const allSamples = useTrackSampleStore((s) => s.allSamples);
  const setAllSamples = useTrackSampleStore((s) => s.setAllSamples);

  const tracks = useMemo<TrackInfo[]>(
    () => generateTracks(trackNumber),
    [trackNumber]
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

  return (
    <TrackAudioStateProvider trackNumber={trackNumber}>
      <LoopControls
        sliderRef={null}
        trackWidth={trackWidth}
        trackNumber={trackNumber}
        setTrackNumber={setTrackNumber}
      />

      {tracks.map((track) => (
        <Track
          key={track.id}
          ref={trackRef}
          trackInfo={track}
          trackWidth={trackWidth}
          trackLeft={trackLeft}
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

      <div className="track-add-remove">
        <button onClick={() => setTrackNumber((n: number) => n + 1)}>+</button>
        <button onClick={() => setTrackNumber((n: number) => n - 1)}>-</button>
      </div>
    </TrackAudioStateProvider>
  );
};

export default TrackList;
