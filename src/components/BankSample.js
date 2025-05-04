// BankSample.js
import React, { useEffect, useState, useRef } from "react";
import CompactWaveform from "./CompactWaveform";
import { loadAudio, getAudioContext } from "../utils/audioManager";
import { timeToPixels } from "../utils/timingUtils";
import "../style/bankSample.css";

const TOTAL_TRACK_WIDTH = 916; // same as your track width constant
const DEFAULT_WAVEFORM_WIDTH = 120;
const WAVEFORM_HEIGHT = 53;

export default function BankSample({ id, sample, btnClass = "", offset }) {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  const btnRef = useRef(null);

  // Load buffer once (either from sample.buffer or from disk)
  useEffect(() => {
    let cancelled = false;
    async function fetchBuffer() {
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

  // Compute the waveform width, clamp to avoid invalid array lengths
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

  // Drag payload carries the buffer-less sample plus the mouse offset
  const handleDragStart = (e) => {
    if (!audioBuffer) return;
    const rect = btnRef.current.getBoundingClientRect();
    const xDragOffset = e.clientX - rect.left;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ...sample, xDragOffset })
    );
  };

  // Quick play on click
  const handleClick = () => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);
    src.start();
  };

  return (
    <button
      ref={btnRef}
      key={id}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
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
}
