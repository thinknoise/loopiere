// src/components/BankRecordingList.tsx

import React, { useEffect, useState, FC, useRef } from "react";
import type { RecordingSample, TrackSampleType } from "../types/audio";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { hydrateAwsSamplesFromS3 } from "../utils/awsHydration";
import { VUMeter } from "./BankRecording/BankRecordingVuMeter";
import BankSample from "./BankSample";
import SampleUploader from "./SampleUploader";
import "../style/bankRecordingList.css";
import "../style/bankTab.css";

const BankRecordingList: FC = () => {
  const [recordings, setRecordings] = useState<RecordingSample[]>([]);
  const [samplesFromAws, setSamplesFromAws] = useState<TrackSampleType[]>([]);
  const [loadFileSelect, setLoadFileSelect] = useState(false);

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
    console.log("Hydrating AWS samples from S3...");
    hydrateAwsSamplesFromS3().then((hydratedSamples) => {
      setSamplesFromAws(hydratedSamples);
      setHydrated(true);
    });
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
        const newRecording: RecordingSample & TrackSampleType = {
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

        console.log("New recording created:", newRecording);
        // this adds neew recordings to the bank sample registry
        // but it doesn't need ot go there because it's not a sample file (aws, local, etc.)
        // addSampleToRegistry(newRecording);
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
      {(loadFileSelect && <SampleUploader />) || (
        <button
          className="load-file-btn"
          onClick={() => setLoadFileSelect(true)}
        >
          File
        </button>
      )}

      <div className="samples">
        {hydrated &&
          samplesFromAws.map((awsSample) => (
            <BankSample
              key={awsSample.id}
              sample={awsSample}
              // dry up wiley
              updateBankSamples={() => {
                console.log("Sample saved, refreshing...");
                hydrateAwsSamplesFromS3().then((hydratedSamples) => {
                  setSamplesFromAws(hydratedSamples);
                  setHydrated(true);
                });
              }}
            />
          ))}
        {recordings.map((recording) => (
          <div className="recording-item" key={recording.id}>
            <BankSample
              key={recording.id}
              sample={recording}
              onRemove={(id) => {
                setRecordings((prev) => prev.filter((s) => s.id !== id));
              }}
              updateBankSamples={() => {
                console.log("recordings saved, refreshing...");
                hydrateAwsSamplesFromS3().then((hydratedSamples) => {
                  setSamplesFromAws(hydratedSamples);
                  setHydrated(true);
                });
                setRecordings((prev) =>
                  prev.filter((s) => s.id !== recording.id)
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankRecordingList;
