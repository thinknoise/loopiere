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

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `./samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer);
      setAudioDuration(Math.round(buffer.duration * 10) / 10);
    };

    loadAudioFile();
  }, [sample.path]);

  // Handle drag start by calculating the offset and updating the context.
  const handleDragStart = (e) => {
    if (audioBuffer) {
      const targetRect = e.target.getBoundingClientRect();
      const xDivMouse = e.clientX - targetRect.left;
      // Create an updated sample with the drag offset and audioBuffer.
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
        width: offset ? `${audioDuration * (916 / 4)}px` : 'auto',
      }}
    >
      <span>{sample.filename.slice(0, -4)}</span>
      <WaveFormDrawing ref={canvasRef} buffer={audioBuffer} width="120" height="53" />
    </button>
  );
};

export default BankSample;
