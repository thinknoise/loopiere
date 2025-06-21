// src/components/TrackList.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  FC,
  RefObject,
} from "react";
import type { TrackSampleType } from "../types/audio";

import Track from "./Track";
import useTrackWidth from "../hooks/useTrackWidth";
import { useRecorder, UseRecorderResult } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { useTrackSampleStore } from "../stores/trackSampleStore";
import { useTrackNumberStore } from "../stores/trackNumberStore";

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

  const { trackNumber, setTrackNumber } = useTrackNumberStore();

  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const [trackWidth, trackLeft] = useTrackWidth(trackRef);

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
    const newSample: TrackSampleType = {
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
    <div>
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

      <div className="track-add-remove">
        <button onClick={() => setTrackNumber(trackNumber + 1)}>+</button>
        <button onClick={() => setTrackNumber(trackNumber - 1)}>-</button>
      </div>
    </div>
  );
};

export default TrackList;
