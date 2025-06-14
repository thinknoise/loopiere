// src/components/BankRecordingList.tsx

import React, { useEffect, useState, FC, useRef } from "react";
import BankSample from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { addSampleToRegistry, getAllAwsSamples } from "../utils/sampleRegistry";
import type { RecordingSample, TrackSample } from "../types/audio";
import "../style/bankRecordingList.css";
import "../style/bankTab.css";
import SampleUploader from "./SampleUploader";
import { hydrateAwsSamplesFromS3 } from "../utils/awsHydration";

const BankRecordingList: FC = () => {
  const [recordings, setRecordings] = useState<RecordingSample[]>([]);
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
    inputLevel,
  } = useRecorder(useAudioContext()) as any;
  const lastHandledBuffer = useRef<AudioBuffer | null>(null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateAwsSamplesFromS3().then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!audioBuffer) return;
    if (audioBuffer === lastHandledBuffer.current) return; // Already handled!
    lastHandledBuffer.current = audioBuffer;

    (async () => {
      const result = await getRecordedBlobURL();
      if (!result) return;
      const { blob, url } = result;
      setRecordings((prevRecordings) => {
        const filename = `Recording${prevRecordings.length + 1}`;
        const date = new Date().toISOString().split("T")[0];
        const newRecording: RecordingSample & TrackSample = {
          id: Date.now(),
          type: "recording",
          blobUrl: url,
          blob: blob,
          filename,
          title: `${filename} ${date}`,
          duration: audioBuffer.duration,
          trimStart: 0,
          trimEnd: audioBuffer.duration,
          buffer: audioBuffer,
          recordedAt: new Date(),
          xPos: 0,
          onTrack: false,
          trackId: 0,
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
        onClick={isRecording ? stopRecording : startRecording}
      >
        <svg
          className="mic-icon"
          xmlns="http://www.w3.org/2000/svg"
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill={isRecording ? "#ff1744" : "rgba(83, 180, 253)"}
          style={{
            verticalAlign: "middle",
            display: "block",
            margin: "auto",
          }}
          aria-label="Start recording"
        >
          <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 1 2 0c0 3.53-2.61 6.43-6 6.92V22h3a1 1 0 1 1 0 2h-8a1 1 0 1 1 0-2h3v-2.08C7.61 18.43 5 15.53 5 12a1 1 0 1 1 2 0c0 2.98 2.19 5.44 5 5.93 2.81-.49 5-2.95 5-5.93z" />
        </svg>
      </button>
      {/* let the vu meter always be there */}
      {<VUMeter inputLevel={inputLevel} />}
      <div className="samples">
        {hydrated &&
          getAllAwsSamples().map((awsSample) => (
            <BankSample key={awsSample.id} sample={awsSample} />
          ))}
        {recordings.map((recording) => (
          <div className="recording-item" key={recording.id}>
            <BankSample
              key={recording.id}
              sample={recording}
              onRemove={(id) => {
                setRecordings((prev) => prev.filter((s) => s.id !== id));
              }}
            />
          </div>
        ))}
      </div>
      <SampleUploader />
    </div>
  );
};

const VUMeter: React.FC<{ inputLevel: number }> = ({ inputLevel }) => (
  <div className="vu-group">
    <div className="vu-meter">
      <div
        className="vu-meter-bar"
        style={{
          height: `${Math.min(100, inputLevel * 100)}%`,
          background:
            inputLevel > 0.85
              ? "#f00"
              : inputLevel > 0.4
              ? "#ffc800"
              : "#00ff8c",
          transition: "height 0.12s cubic-bezier(.4,2.2,.8,1.0)",
        }}
      />
    </div>
    <svg
      className="vu-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Speaker with wave"
    >
      <polygon points="5 9 9 9 13 5 13 19 9 15 5 15 5 9" fill="#53b4fdd3" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7" stroke="#53b4fdd3" />
      <path d="M20 5a9 9 0 0 1 0 14" stroke="rgba(83, 180, 253, 0.83)" />
    </svg>
  </div>
);

export default BankRecordingList;
