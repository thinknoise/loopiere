// src/components/BankRecordingList.tsx

import React, { useEffect, useState, useRef, FC } from "react";
import BankSample from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { BiSolidMicrophoneAlt } from "react-icons/bi";
import { PiMicrophoneSlashDuotone } from "react-icons/pi";
import { v4 as uuid } from "uuid";

// shape of each recording
interface Recording {
  id: string;
  buffer: AudioBuffer;
  filename: string;
  duration: number;
  path: string;
  url: string;
}

// props for this component
interface BankRecordingListProps {
  handleDragStart: (...args: any[]) => void;
}

// explicit typing for our recorder hook
interface UseRecorderResult {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  audioBuffer: AudioBuffer | null;
  getRecordedBlobURL: () => Promise<string>;
}

const BankRecordingList: FC<BankRecordingListProps> = ({ handleDragStart }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const processedRef = useRef<Set<AudioBuffer>>(new Set());

  // assert the hook return so TS knows the shapes
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
  } = useRecorder(useAudioContext()) as UseRecorderResult;

  useEffect(() => {
    if (!audioBuffer) return;

    // skip duplicates
    if (processedRef.current.has(audioBuffer)) return;
    processedRef.current.add(audioBuffer);

    let isMounted = true;
    (async () => {
      try {
        const url = await getRecordedBlobURL();
        if (!isMounted) return;

        setRecordings((prev) => [
          ...prev,
          {
            id: uuid(),
            buffer: audioBuffer,
            filename: `Recording ${prev.length + 1}`,
            duration: audioBuffer.duration,
            path: url,
            url,
          },
        ]);
      } catch (error) {
        console.error("Error generating recording URL", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [audioBuffer, getRecordedBlobURL]);

  return (
    <div className="recording-ui">
      <button
        className="record-btn-wrapper"
        style={{ zIndex: isRecording ? 0 : 1 }}
        onClick={startRecording}
      >
        <BiSolidMicrophoneAlt
          size={32}
          style={{
            opacity: isRecording ? 0 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </button>

      <button
        className="record-btn-wrapper"
        style={{ zIndex: isRecording ? 1 : 0 }}
        onClick={stopRecording}
      >
        <PiMicrophoneSlashDuotone
          size={32}
          style={{
            opacity: isRecording ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </button>

      {isRecording && <p>Recording...</p>}

      <div className="samples">
        {recordings.map((sample, i) => (
          <BankSample
            key={sample.id}
            id={i}
            sample={sample}
            handleDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default BankRecordingList;
