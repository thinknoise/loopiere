// BankSample.js
import React, { useEffect, useState, useRef } from 'react';
import WaveSurferWaveform from './WaveSurferWaveform';
import { loadAudio } from '../utils/audioManager';
import { useDrag } from '../context/DragContext';
import '../style/bankSample.css';

const BEATS_PER_MEASURE = 4;
const TOTAL_TRACK_WIDTH = 916;
const PIXELS_PER_SECOND = TOTAL_TRACK_WIDTH / BEATS_PER_MEASURE;
const DEFAULT_BANK_WIDTH = 250;

const BankSample = ({ id, sample }) => {
  const [audioState, setAudioState] = useState({ buffer: null, duration: null });
  const { updateDragItem, updateDragPosition } = useDrag();
  const offsetRef = useRef(0);

  // load buffer & duration
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const buffer = await loadAudio(`/samples/${sample.path}`);
      if (!cancelled) {
        setAudioState({ buffer, duration: Math.round(buffer.duration * 10) / 10 });
      }
    })();
    return () => { cancelled = true; };
  }, [sample.path]);

  // compute width
  const sampleWidth = audioState.duration
    ? audioState.duration * PIXELS_PER_SECOND
    : DEFAULT_BANK_WIDTH;

  // THIS is your native drag start
  const handleNativeDragStart = (e) => {
    // record where within the button the user grabbed
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    offsetRef.current = offset;

    // update global drag context
    updateDragItem({
      ...sample,
      xDragOffset: offset,
      audioBuffer: audioState.buffer,
      audioDuration: audioState.duration,
      path: sample.path,
      filename: sample.filename,
    });
    updateDragPosition({ x: e.clientX, y: e.clientY });

    // tell the browser “this is a move‐type drag”
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <button
      key={id}
      className="bank-sample-btn"
      draggable="true"
      onDragStart={handleNativeDragStart}  // ← real drag start
      style={{ width: `${sampleWidth}px` }}
    >
      <span>{sample.filename.slice(0, -4)}</span>
      {audioState.buffer && (
        <WaveSurferWaveform
          url={`/samples/${sample.path}`}
          pixelWidth={sampleWidth}
          height={53}
          waveColor="rgba(83, 180, 253, 0.83)"
          progressColor="#036"
        />
      )}
    </button>
  );
};

export default BankSample;
