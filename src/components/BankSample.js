// BankSample.js
import React, { useEffect, useState, useRef } from 'react';
import WaveFormDrawing from './WaveFormDrawing';
import { loadAudio, getAudioContext } from '../utils/audioManager';
import { useSelectedSample } from '../context/SelectedSampleContext';
import '../style/bankSample.css';

const BankSample = ({ id, sample, btnClass, offset }) => {
  const { updateSelectedSample } = useSelectedSample();
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const canvasRef = useRef(null);

  // Define constants for calculating the width of the sample.
  const BEATS_PER_MEASURE = 4;
  const TOTAL_TRACK_WIDTH = 916; // This is the width representing 4 beats.
  const pixelsPerSecond = TOTAL_TRACK_WIDTH / BEATS_PER_MEASURE; // ~229 px per second

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `./samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer);
      setAudioDuration(Math.round(buffer.duration * 10) / 10);
    };

    loadAudioFile();
  }, [sample.path]);

  // Handle drag start by calculating the mouse offset and updating the selected sample context.
  const handleDragStart = (e) => {
    if (audioBuffer) {
      const targetRect = e.target.getBoundingClientRect();
      const xDivMouse = e.clientX - targetRect.left;
      const updatedSample = {
        ...sample,
        xDragOffset: xDivMouse,
        audioBuffer,
      };
      updateSelectedSample(updatedSample);
    } else {
      console.log('Audio buffer is not yet loaded');
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

  return (
    <button
      key={id}
      draggable
      onDragStart={handleDragStart}
      onClick={playAudio}
      className="bank-sample-btn"
      style={{
        left: offset ? `${offset}px` : '',
        width: offset ? `${audioDuration * pixelsPerSecond}px` : 'auto',
      }}
    >
      <span>{sample.filename.slice(0, -4)}</span>
      <WaveFormDrawing ref={canvasRef} buffer={audioBuffer} width="120" height="53" />
    </button>
  );
};

export default BankSample;
