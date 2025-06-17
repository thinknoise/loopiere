// src/components/BankSample.tsx

import React, { FC, useEffect, useState, useRef, DragEvent } from "react";
import CompactWaveform from "./CompactWaveform";
import SaveSampleButton from "./BankRecording/BankRecordingSaveSampleButton";
import { loadAudio } from "../utils/audioManager";
import { useAudioContext } from "./AudioContextProvider";
import { resumeAudioContext } from "../utils/audioContextSetup";
import { resolveSamplePath } from "../utils/resolveSamplePath";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, REGION, s3 } from "../utils/awsConfig";
import "../style/bankSample.css";

export interface Sample {
  id?: string | number;
  filename: string;
  path?: string | null;
  url?: string | null;
  buffer?: AudioBuffer | null;
  [key: string]: any;
}

export interface BankSampleProps {
  sample: Sample;
  offset?: number;
  btnClass?: string;
  onRemove?: (id: string | number) => void;
  onSampleSaved: () => void;
}

const TOTAL_TRACK_WIDTH = 916;
const DEFAULT_WAVEFORM_WIDTH = 220;
const WAVEFORM_HEIGHT = 53;

const BankSample: FC<BankSampleProps> = ({
  sample,
  offset,
  btnClass = "",
  onRemove,
  onSampleSaved,
}) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const audioContext = useAudioContext();

  useEffect(() => {
    let cancelled = false;
    async function fetchBuffer() {
      if (sample.buffer) {
        setAudioBuffer(sample.buffer);
        setDuration(sample.buffer.duration);
      } else if (sample.url || sample.path) {
        try {
          const src = resolveSamplePath(sample.url || sample.path || "");
          const buf = await loadAudio(src);
          if (!cancelled) {
            setAudioBuffer(buf);
            setDuration(buf.duration);
          }
        } catch (err) {
          console.error("Failed to load sample:", sample, err);
        }
      }
    }
    fetchBuffer();
    return () => {
      cancelled = true;
    };
  }, [sample]);

  const PIXELS_PER_SECOND = 80; // or whatever looks right visually

  const waveformWidth = Math.max(
    1,
    Math.min(
      TOTAL_TRACK_WIDTH,
      offset != null
        ? Math.floor(duration * PIXELS_PER_SECOND)
        : DEFAULT_WAVEFORM_WIDTH
    )
  );

  const onDragStart = (e: DragEvent<HTMLButtonElement>) => {
    const rect = btnRef.current!.getBoundingClientRect();
    const xDragOffset = e.clientX - rect.left;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: sample.id, xDragOffset })
    );
  };

  const onClick = () => {
    if (!audioBuffer) return;
    resumeAudioContext();
    const src = audioContext.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(audioContext.destination);
    src.start();
  };

  async function saveSampleToS3AndRegistry(
    sample: Sample,
    onSampleSaved: () => void
  ): Promise<boolean> {
    if (!sample.blob || !sample.filename) {
      console.error("Invalid sample: missing blob or filename");
      return false;
    }

    const key = `uploads/${Date.now()}-${sample.filename}.wav`;

    try {
      const buffer = await sample.blob.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: sample.blob.type,
      });

      await s3.send(command);

      const uploadedSample = {
        name: sample.filename + ".wav",
        s3Key: key,
        s3Url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
        createdAt: Date.now(),
      };

      console.log("Sample uploaded to S3:", uploadedSample, onSampleSaved);

      // Optionally: hydrate all again if needed right away
      if (onSampleSaved) {
        onSampleSaved();
      }

      return true;
    } catch (err) {
      console.error("Failed to upload and register sample:", err);
      return false;
    }
  }

  return (
    <button
      ref={btnRef}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bank-sample-btn ${btnClass}`}
      style={{
        left: offset != null ? `${offset}px` : undefined,
        width: `${waveformWidth}px`,
      }}
    >
      <span>{sample.filename.replace(/\.\w+$/, "")}</span>
      <span>{sample.filename}s</span>
      {audioBuffer && (
        <CompactWaveform
          buffer={audioBuffer}
          width={waveformWidth}
          height={WAVEFORM_HEIGHT}
        />
      )}
      {onRemove && (
        <span
          className="remove-sample-btn"
          onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation(); // Prevent playback on parent button
            if (sample.id !== undefined) {
              onRemove(sample.id);
            }
          }}
          role="button"
          aria-label="Remove sample"
        />
      )}
      {/* Save button 
      This button is only shown if the sample is not a .wav file.
      */}
      {sample.filename.substring(sample.filename.length - 4) !== ".wav" && (
        <SaveSampleButton
          onSave={() => saveSampleToS3AndRegistry(sample, onSampleSaved)}
        />
      )}
    </button>
  );
};

export default BankSample;
