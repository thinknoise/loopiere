// src/components/BankSample.tsx

import React, { FC, useEffect, useState, useRef, DragEvent } from "react";
import type { BaseSample } from "../types/audio";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET, s3 } from "../utils/awsConfig";
import { useAudioContext } from "./AudioContextProvider";
import { loadAudio } from "../utils/audioManager";
import { resumeAudioContext } from "../utils/audioContextSetup";
import { resolveSamplePath } from "../utils/resolveSamplePath";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import { useLoopSettings } from "../context/LoopSettingsContext";
import CompactWaveform from "./CompactWaveform";
import "../style/bankSample.css";

export interface BankSampleProps {
  sample: BaseSample;
  offset?: number;
  btnClass?: string;
  onRemove?: (id: string | number) => void;
  updateBankSamples?: () => void;
}

const TOTAL_TRACK_WIDTH = 916;
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

  const btnRef = useRef<HTMLDivElement>(null);
  const audioContext = useAudioContext();

  useEffect(() => {
    let cancelled = false;
    async function fetchBuffer() {
      if (sample.buffer) {
        setAudioBuffer(sample.buffer);
        setDuration(sample.buffer.duration);
      } else if (sample.type === "aws" && sample.path) {
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
    console.log("Fetching sample buffer for:", sample, duration);
    sample.trimEnd = duration; // need to be able to trim with interface
    sample.trimStart = sample.trimStart ?? 0;
    fetchBuffer();
    return () => {
      cancelled = true;
    };
  }, [duration, sample]);

  const { bpm, beatsPerLoop } = useLoopSettings();
  const secsPerMeasure = bpmToSecondsPerLoop(bpm, beatsPerLoop);

  const trackWidth = window.innerWidth; // or whatever looks right visually

  const rawWidth = duration
    ? Math.floor((duration / secsPerMeasure) * trackWidth)
    : 0;

  const waveformWidth = Math.max(1, Math.min(rawWidth, TOTAL_TRACK_WIDTH));

  const [durationOffsetX, setDurationOffsetX] = useState(0);
  const [isDraggingDuration, setIsDraggingDuration] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingDuration || !btnRef.current) return;

      const containerRect = btnRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left;
      // Clamp to bounds
      const clampedX = Math.max(0, Math.min(containerRect.width, newX));
      const trimEndPercent = Math.abs(clampedX / containerRect.width - 1);
      console.log("trimEndPercent:", trimEndPercent);
      sample.trimEnd = duration * trimEndPercent;
      setDurationOffsetX(clampedX);
    };

    const handleMouseUp = () => {
      if (isDraggingDuration) {
        setIsDraggingDuration(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingDuration]);

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (isDraggingDuration) {
      e.preventDefault();
      return;
    }
    const rect = btnRef.current!.getBoundingClientRect();
    const xDragOffset = e.clientX - rect.left;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: sample.id, xDragOffset })
    );
  };

  function handleRemoveClick(
    e: React.MouseEvent<HTMLSpanElement>,
    sample: BaseSample,
    onRemove?: (id: string | number) => void
  ) {
    e.stopPropagation();

    if (sample.id === undefined) return;

    if (sample.type === "aws" && sample.filename) {
      console.log("Trying to delete sample:", sample);
      deleteSampleFromS3AndRegistry(sample.filename).then((success) => {
        if (success && onRemove) {
          console.log("Sample deleted successfully:", sample.id);
          onRemove(sample.id!);
        }
      });
    } else if (onRemove) {
      onRemove(sample.id!);
    }
  }

  const onClickAudioClip = (e: React.MouseEvent<HTMLButtonElement>) => {
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
    <div
      ref={btnRef}
      draggable
      onDragStart={onDragStart}
      className={`bank-sample-container ${btnClass}`} // keep same styling as before
      style={{
        left: offset != null ? `${offset}px` : undefined,
        width: `${waveformWidth}px`,
      }}
    >
      <button className="bank-sample-btn" onClick={onClickAudioClip}>
        <div className="sample-type">{btnClass}</div>
        {audioBuffer && (
          <CompactWaveform
            buffer={audioBuffer}
            width={waveformWidth}
            height={WAVEFORM_HEIGHT}
          />
        )}
      </button>
      <span
        className={`remove-sample-btn ${sample.type}`}
        onClick={(e) => handleRemoveClick(e, sample, onRemove)}
        role="button"
        aria-label="Remove sample"
      />

      <span className="sample-title">{sample.title}</span>
      <div
        className="sample-duration"
        draggable={false}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingDuration(true);
        }}
        style={{
          left: `${durationOffsetX}px`,
        }}
      >
        {audioBuffer ? audioBuffer.duration.toFixed(2) : "0.00"}s
      </div>
    </div>
  );
};

export default BankSample;
