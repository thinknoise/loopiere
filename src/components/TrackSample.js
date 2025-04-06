import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveFormDrawing from './WaveFormDrawing';
import { loadAudio } from '../utils/audioManager';
import '../style/bankSample.css';
import '../style/trackSample.css';

const TrackSample = ({
  sample,
  trackWidth,
  trackLeft,
  editSampleOfSamples,
  bpm,
  updateSamplesWithNewPosition,
}) => {
  const canvasRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 });
  const sampleRef = useRef(sample);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef(0); // Store the offset where the user clicked

  const secsPerMeasure = (60 / bpm) * 4;

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `/samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer);
      setAudioDuration(Math.round(buffer.duration * 10) / 10);
    };

    loadAudioFile();
  }, [sample.path]);

  // When the user clicks down on the sample, record the offset
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    const rect = e.target.getBoundingClientRect();
    offsetRef.current = e.clientX - rect.left;
  };

  // While dragging, update the position relative to the initial click offset
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      let newX = e.clientX - trackLeft - offsetRef.current;
      newX = Math.max(newX, 0); // Clamp to 0 if negative
      setDraggingPosition({ x: newX, y: 0 });
    },
    [trackLeft]
  );

  // When the drag ends, update the sample's position on the track
  const handleMouseUp = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      let newX = e.clientX - trackLeft - offsetRef.current;
      newX = Math.max(newX, 0);
      const newXPositionPercentage = newX / trackWidth;
      updateSamplesWithNewPosition(sampleRef.current.trackSampleId, newXPositionPercentage);
    },
    [trackLeft, trackWidth, updateSamplesWithNewPosition]
  );

  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    editSampleOfSamples(sampleRef.current, true);
  };

  useEffect(() => {
    const handleWindowMouseUp = (e) => {
      if (isDraggingRef.current) {
        handleMouseUp(e);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className="track-btn-wrapper"
      style={{
        left: `${isDraggingRef.current ? draggingPosition.x : sample.xPos * trackWidth}px`,
        top: '0px',
        width: audioDuration ? `${(audioDuration / secsPerMeasure) * trackWidth}px` : 'auto',
      }}
    >
      <button className="remove-track-btn" onClick={handleRemoveSample}></button>
      <button
        key={sample.trackSampleId}
        className="track-sample-btn"
        onMouseDown={handleMouseDown}
        style={{
          width: audioDuration ? `${(audioDuration / secsPerMeasure) * trackWidth}px` : 'auto',
        }}
      >
        <span>{sample.filename.slice(0, -4)}</span>
        <WaveFormDrawing ref={canvasRef} buffer={audioBuffer} width="120" height="53" />
      </button>
    </div>
  );
};

export default TrackSample;
