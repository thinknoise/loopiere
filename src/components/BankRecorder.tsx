// src/components/BankRecorder.tsx

import React, { useEffect, useState, useRef } from "react";
import type { RecordingSample } from "../types/audio";
import { useAudioContext } from "./AudioContextProvider";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, REGION, s3 } from "../utils/awsConfig";
import { useRecorder } from "../hooks/useRecorder";
import { VUMeter } from "./BankRecording/BankRecordingVuMeter";
import BankSample, { Sample } from "./BankSample";
import SaveSampleButton from "./BankRecording/BankRecordingSaveSampleButton";
import SampleUploader from "./SampleUploader";
import "../style/BankRecorder.css";
import "../style/bankTab.css";

interface BankRecorderProps {
  fetchBankDirectories: () => Promise<void>;
}

const BankRecorder: React.FC<BankRecorderProps> = ({
  fetchBankDirectories,
}) => {
  const [recordings, setRecordings] = useState<RecordingSample[]>([]);
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
        const newRecording: RecordingSample = {
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
        };

        console.log("New recording created:", newRecording);
        // this adds neew recordings to the bank sample registry
        // but it doesn't need ot go there because it's not a sample file (aws, local, etc.)
        // addSampleToRegistry(newRecording);
        return [...prevRecordings, newRecording];
      });
    })();
  }, [audioBuffer, getRecordedBlobURL]);

  async function saveSampleToS3AndRegistry(
    sample: Sample,
    directory: string = "recorded"
  ): Promise<boolean> {
    if (!sample.blob || !sample.filename) {
      console.error("Invalid sample: missing blob or filename");
      return false;
    }

    const key = `banks/${directory}/${Date.now()}-${sample.filename}.wav`;

    try {
      const buffer = await sample.blob.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: sample.blob.type,
      });

      await s3.send(command);
      console.log("Sample uploaded to S3:", key);
      return true;
    } catch (err) {
      console.error("Failed to upload and register sample:", err);
      return false;
    }
  }

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
        {recordings.map((recording) => (
          <div className="recording-item" key={recording.id}>
            <BankSample
              key={recording.id}
              btnClass="recording-sample-btn"
              sample={recording}
              onRemove={(id) => {
                setRecordings((prev) => prev.filter((s) => s.id !== id));
              }}
            />
            <SaveSampleButton
              onSave={() =>
                saveSampleToS3AndRegistry(recording).then((success) => {
                  if (success) {
                    console.log("Recording saved successfully");
                    fetchBankDirectories();
                    setRecordings((prev) =>
                      prev.filter((s) => s.id !== recording.id)
                    );
                  } else {
                    console.error("Failed to save recording");
                  }
                  return success;
                })
              }
            />
          </div>
        ))}
      </div>

      {(loadFileSelect && <SampleUploader />) || (
        <button
          className="load-file-btn"
          onClick={() => setLoadFileSelect(true)}
        >
          File
        </button>
      )}
    </div>
  );
};

export default BankRecorder;
