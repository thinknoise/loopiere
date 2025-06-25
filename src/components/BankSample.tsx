// src/components/BankSample.tsx

import React, { FC, useEffect, useState, useRef, DragEvent } from "react";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import CompactWaveform from "./CompactWaveform";
import { useAudioContext } from "./AudioContextProvider";
import { loadAudio } from "../utils/audioManager";
import { resumeAudioContext } from "../utils/audioContextSetup";
import { resolveSamplePath } from "../utils/resolveSamplePath";
import { BUCKET, REGION, s3 } from "../utils/awsConfig";
import "../style/bankSample.css";

export interface Sample {
  id?: string | number;
  filename: string;
  path?: string | null;
  buffer?: AudioBuffer | null;
  [key: string]: any;
}

export interface BankSampleProps {
  sample: Sample;
  offset?: number;
  btnClass?: string;
  onRemove?: (id: string | number) => void;
  updateBankSamples?: () => void;
}

const TOTAL_TRACK_WIDTH = 916;
const DEFAULT_WAVEFORM_WIDTH = 220;
const WAVEFORM_HEIGHT = 53;

const BankSample: FC<BankSampleProps> = ({
  sample,
  offset,
  btnClass = "",
  onRemove,
  updateBankSamples,
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
      } else if (sample.path) {
        try {
          const src = resolveSamplePath(sample.path);
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

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent playback on parent button

    console.log("Sample clicked:", sample);
    if (!audioBuffer) return;
    resumeAudioContext();
    const src = audioContext.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(audioContext.destination);
    src.start();
  };

  async function deleteSampleFromS3AndRegistry(
    s3Key: string
  ): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: `banks/${s3Key}`,
      });

      await s3.send(command);

      // Optionally remove from registry/database here
      // await deleteFromRegistry(s3Key); // depends on your implementation

      console.log("Sample deleted from S3:", s3Key);
      if (updateBankSamples) {
        console.log("Updating bank samples after deletion");
        updateBankSamples();
      }

      return true;
    } catch (err) {
      console.error("Failed to delete sample from S3:", err);
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
      <div className="sample-type">{btnClass}</div>
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
      {sample.type === "aws" && (
        <span
          className="remove-sample-btn aws"
          onClick={() => {
            console.log("Trying to delete sample:", sample);

            if (sample.filename) {
              deleteSampleFromS3AndRegistry(sample.filename).then((success) => {
                if (success && onRemove && sample.id !== undefined) {
                  onRemove(sample.id);
                }
              });
            }
          }}
          role="button"
          aria-label="Remove sample"
        />
      )}
    </button>
  );
};

export default BankSample;
