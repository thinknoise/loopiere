// src/components/BankRecordingList.tsx

import React, { useEffect, useState, FC } from "react";
import BankSample, { Sample } from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { BiSolidMicrophoneAlt } from "react-icons/bi";
import { PiMicrophoneSlashDuotone } from "react-icons/pi";
import { v4 as uuid } from "uuid";
import "../style/bankTab.css";

interface Recording extends Sample {
  id: string;
  buffer: AudioBuffer;
  filename: string;
  duration: number;
  url: string;
}

const BankRecordingList: FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
  } = useRecorder(useAudioContext()) as any;

  useEffect(() => {
    if (!audioBuffer) return;
    (async () => {
      const url = await getRecordedBlobURL();
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
    })();
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
        {recordings.map((recording) => (
          <BankSample key={recording.id} sample={recording} />
        ))}
      </div>
    </div>
  );
};

export default BankRecordingList;
