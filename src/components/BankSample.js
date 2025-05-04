// BankSample.js
import React, { useEffect, useState, useRef } from "react";
import WaveFormDrawing from "./WaveFormDrawing";
import { loadAudio, getAudioContext } from "../utils/audioManager";
import { timeToPixels } from "../utils/timingUtils";
import CompactWaveform from "./CompactWaveform";

import "../style/bankSample.css";

const BankSample = ({ id, sample, btnClass, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const canvasRef = useRef(null);

  // Define constants for calculating the width of the sample.
  const TOTAL_TRACK_WIDTH = 916;

  useEffect(() => {
    if (sample.buffer) {
      setAudioBuffer(sample.buffer);
      setAudioDuration(Math.round(sample.buffer.duration * 10) / 10);
    } else if (sample.path) {
      const loadAudioFile = async () => {
        const fullPath = `/samples/${sample.path}`;
        const buffer = await loadAudio(fullPath);
        setAudioBuffer(buffer);
        setAudioDuration(Math.round(buffer.duration * 10) / 10);
      };
      loadAudioFile();
    }
  }, [sample]);

  // Handle drag start by serializing sample data and storing in dataTransfer
  const handleDragStart = (e) => {
    if (audioBuffer) {
      const targetRect = e.target.getBoundingClientRect();
      const xDivMouse = e.clientX - targetRect.left;

      // Prepare the sample data for drag — omit audioBuffer
      const dragSample = {
        ...sample,
        xDragOffset: xDivMouse,
      };

      e.dataTransfer.setData("application/json", JSON.stringify(dragSample));
    } else {
      console.log("Audio buffer not yet loaded");
    }
  };

  // Play the audio using the shared AudioContext.
  const playAudio = async () => {
    if (audioBuffer) {
      const context = getAudioContext();
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start();
    }
  };

  useEffect(() => {
    if (sample.buffer) {
      setAudioBuffer(sample.buffer);
      setAudioDuration(Math.round(sample.buffer.duration * 10) / 10);
    } else if (sample.path) {
      const loadAudioFile = async () => {
        const fullPath = `/samples/${sample.path}`;
        const buffer = await loadAudio(fullPath);
        setAudioBuffer(buffer);
        setAudioDuration(Math.round(buffer.duration * 10) / 10);
      };
      loadAudioFile();
    }
  }, [sample]);

  return (
    <button
      key={id}
      draggable
      onDragStart={handleDragStart}
      onClick={playAudio}
      className="bank-sample-btn"
      style={{
        left: offset ? `${offset}px` : "",
        width: offset
          ? `${timeToPixels(audioDuration, TOTAL_TRACK_WIDTH, 120)}px`
          : "auto",
      }}
    >
      <span>{sample.filename.slice(0, -4)}</span>
      <CompactWaveform buffer={audioBuffer} width={120} height={53} />
    </button>
  );
};

export default BankSample;
