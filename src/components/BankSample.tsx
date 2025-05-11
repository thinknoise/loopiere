// src/components/BankSample.tsx

import React, { useEffect, useState, useRef, FC, DragEvent } from "react";
import CompactWaveform from "./CompactWaveform";
import { loadAudio } from "../utils/audioManager";
import { useAudioContext } from "./AudioContextProvider";
import { resumeAudioContext } from "../utils/audioContextSetup";
import { timeToPixels } from "../utils/timingUtils";
import "../style/bankSample.css";
import { Sample } from "./BankSampleList";

const TOTAL_TRACK_WIDTH = 916;
const DEFAULT_WAVEFORM_WIDTH = 120;
const WAVEFORM_HEIGHT = 53;

export interface BankSampleProps {
  id: number;
  sample: Sample;
  btnClass?: string;
  offset?: number;
  handleDragStart: (...args: any[]) => void;
}

const BankSample: FC<BankSampleProps> = ({
  id,
  sample,
  btnClass = "",
  offset,
  handleDragStart,
}) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const audioContext = useAudioContext();

  // Load the audio buffer once per sample
  useEffect(() => {
    let cancelled = false;

    async function fetchBuffer(): Promise<void> {
      if (sample.buffer) {
        setAudioBuffer(sample.buffer);
        setDuration(sample.buffer.duration);
      } else if (sample.path) {
        try {
          const buf = await loadAudio(`/samples/${sample.path}`);
          if (!cancelled) {
            setAudioBuffer(buf);
            setDuration(buf.duration);
          }
        } catch (err) {
          console.error("Failed to load bank sample:", sample.path, err);
        }
      }
    }

    fetchBuffer();
    return () => {
      cancelled = true;
    };
  }, [sample]);

  // Compute waveform width, clamped to valid range
  const waveformWidth = Math.max(
    1,
    Math.min(
      TOTAL_TRACK_WIDTH,
      offset != null
        ? Math.floor(
            timeToPixels(duration, TOTAL_TRACK_WIDTH, DEFAULT_WAVEFORM_WIDTH)
          )
        : DEFAULT_WAVEFORM_WIDTH
    )
  );

  // Handle drag start: set data + forward to parent handler
  const onDragStart = (e: DragEvent<HTMLButtonElement>): void => {
    if (!audioBuffer || !btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();
    const xDragOffset = e.clientX - rect.left;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ...sample, xDragOffset })
    );

    handleDragStart(e, id);
  };

  // Quick play on click
  const onClick = (): void => {
    if (!audioBuffer) return;
    resumeAudioContext();
    const src = audioContext.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(audioContext.destination);
    src.start();
  };

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
      {audioBuffer && (
        <CompactWaveform
          buffer={audioBuffer}
          width={waveformWidth}
          height={WAVEFORM_HEIGHT}
        />
      )}
    </button>
  );
};

export default BankSample;
