// src/components/BankSample.tsx

import React, { FC, useEffect, useState, useRef, DragEvent } from "react";
import CompactWaveform from "./CompactWaveform";
import { loadAudio } from "../utils/audioManager";
import { useAudioContext } from "./AudioContextProvider";
import { resumeAudioContext } from "../utils/audioContextSetup";
import { timeToPixels } from "../utils/timingUtils";
import "../style/bankSample.css";
import { resolveSamplePath } from "../utils/resolveSamplePath";

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
  bpm: number;
  beatsPerLoop: number;
}

const TOTAL_TRACK_WIDTH = 916;
const DEFAULT_WAVEFORM_WIDTH = 120;
const WAVEFORM_HEIGHT = 53;

const BankSample: FC<BankSampleProps> = ({
  sample,
  offset,
  btnClass = "",
  onRemove,
  bpm,
  beatsPerLoop,
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

  const waveformWidth = Math.max(
    1,
    Math.min(
      TOTAL_TRACK_WIDTH,
      offset != null
        ? Math.floor(
            timeToPixels(
              duration,
              TOTAL_TRACK_WIDTH,
              DEFAULT_WAVEFORM_WIDTH,
              beatsPerLoop
            )
          )
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
    </button>
  );
};

export default BankSample;
