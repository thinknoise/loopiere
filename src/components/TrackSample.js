import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveFormDrawing from './WaveFormDrawing';
import { loadAudio } from '../utils/audioManager';
import useEventListener from '../hooks/useEventListener';
import '../style/trackSample.css';

const TrackSample = ({
  sample,
  trackWidth,
  trackLeft,
  editSampleOfSamples,
  bpm,
  updateSamplesWithNewPosition,
}) => {
  // Group audio-related state
  const [audioState, setAudioState] = useState({
    buffer: null,
    duration: null,
  });
  // Group dragging-related state
  const [dragState, setDragState] = useState({
    isDragging: false,
    position: { x: 0, y: 0 },
    offset: 0,
  });
  const canvasRef = useRef(null);
  const sampleRef = useRef(sample);

  const secsPerMeasure = (60 / bpm) * 4;

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `/samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioState({
        buffer,
        duration: Math.round(buffer.duration * 10) / 10,
      });
    };
    loadAudioFile();
  }, [sample.path]);

  // Record where within the sample the user clicked
  const handleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    setDragState((prev) => ({ ...prev, isDragging: true, offset }));
  };

  // Update the dragging position based on the stored offset
  const handleMouseMove = useCallback(
    (e) => {
      if (!dragState.isDragging) return;
      let newX = e.clientX - trackLeft - dragState.offset;
      newX = Math.max(newX, 0); // Clamp to 0 if negative
      setDragState((prev) => ({ ...prev, position: { x: newX, y: 0 } }));
    },
    [dragState.isDragging, dragState.offset, trackLeft]
  );

  // When the drag ends, update the sample's position on the track
  const handleMouseUp = useCallback(
    (e) => {
      if (!dragState.isDragging) return;
      setDragState((prev) => ({ ...prev, isDragging: false }));
      let newX = e.clientX - trackLeft - dragState.offset;
      newX = Math.max(newX, 0);
      const newXPositionPercentage = newX / trackWidth;
      updateSamplesWithNewPosition(sampleRef.current.trackSampleId, newXPositionPercentage);
    },
    [dragState.isDragging, dragState.offset, trackLeft, trackWidth, updateSamplesWithNewPosition]
  );

  // Use our custom hook to attach global event listeners.
  useEventListener('mousemove', handleMouseMove);
  useEventListener('mouseup', (e) => {
    if (dragState.isDragging) handleMouseUp(e);
  });

  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    editSampleOfSamples(sampleRef.current, true);
  };

  return (
    <div
      className="track-btn-wrapper"
      style={{
        left: `${dragState.isDragging ? dragState.position.x : sample.xPos * trackWidth}px`,
        top: '0px',
        width: audioState.duration ? `${(audioState.duration / secsPerMeasure) * trackWidth}px` : 'auto',
      }}
    >
      <button className="remove-track-btn" onClick={handleRemoveSample}></button>
      <button
        key={sample.trackSampleId}
        className="track-sample-btn"
        onMouseDown={handleMouseDown}
        style={{
          width: audioState.duration ? `${(audioState.duration / secsPerMeasure) * trackWidth}px` : 'auto',
        }}
      >
        <span>{sample.filename.slice(0, -4)}</span>
        <WaveFormDrawing ref={canvasRef} buffer={audioState.buffer} width="120" height="53" />
      </button>
    </div>
  );
};

export default TrackSample;
