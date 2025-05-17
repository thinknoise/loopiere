// src/components/BankRecordingList.tsx

import React, { useEffect, useState, FC, useRef } from "react";
import BankSample from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { BiSolidMicrophoneAlt } from "react-icons/bi";
import { PiMicrophoneSlashDuotone } from "react-icons/pi";
import { addSampleToRegistry } from "../utils/sampleRegistry";
import { SampleDescriptor } from "../utils/audioManager";
import "../style/bankRecordingList.css";
import "../style/bankTab.css";

export interface Recording extends SampleDescriptor {
  id: number; // numeric
  buffer: AudioBuffer; // must be present
  url: string; // must have a blob URL
  filename: string; // must have a human label
  duration: number; // must have duration
  inputLevel: number;
  // trackId/xPos/onTrack/startTime are still optional until placement
}

const BankRecordingList: FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
    inputLevel,
  } = useRecorder(useAudioContext()) as any;
  const lastHandledBuffer = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    if (!audioBuffer) return;
    if (audioBuffer === lastHandledBuffer.current) return; // Already handled!
    lastHandledBuffer.current = audioBuffer;

    (async () => {
      const url = await getRecordedBlobURL();
      setRecordings((prevRecordings) => {
        const filename = `Recording ${prevRecordings.length + 1}`;
        const newRecording: Recording = {
          id: Date.now(),
          buffer: audioBuffer,
          url,
          filename,
          duration: audioBuffer.duration,
          path: url,
          xPos: 0,
          onTrack: false,
          trackId: undefined,
          inputLevel: 0,
        };

        addSampleToRegistry(newRecording);
        return [...prevRecordings, newRecording];
      });
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
      {/* let the vu meter always be there */}
      {<VUMeter inputLevel={inputLevel} />}
      <div className="samples">
        {recordings.map((recording) => (
          <BankSample key={recording.id} sample={recording} />
        ))}
      </div>
    </div>
  );
};

const VUMeter: React.FC<{ inputLevel: number }> = ({ inputLevel }) => (
  <div className="vu-meter">
    <div
      className="vu-meter-bar"
      style={{
        height: `${Math.min(100, inputLevel * 100)}%`,
        background:
          inputLevel > 0.85 ? "#f00" : inputLevel > 0.4 ? "#ffc800" : "#00ff8c",
        transition: "height 0.12s cubic-bezier(.4,2.2,.8,1.0)",
      }}
    />
  </div>
);

export default BankRecordingList;
