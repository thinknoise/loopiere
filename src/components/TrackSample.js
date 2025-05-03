// TrackSample.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurferWaveform from './WaveSurferWaveform';
import { loadAudio } from '../utils/audioManager';
import { useDrag } from '../context/DragContext';
import useEventListener from '../hooks/useEventListener';
import '../style/trackSample.css';

const TrackSample = ({
  sample,
  trackWidth,
  trackLeft,
  editSampleOfSamples,          // ← make sure this prop is passed in
  bpm,
  updateSamplesWithNewPosition,
}) => {
  const [audioState, setAudioState] = useState({ buffer: null, duration: null });
  const sampleRef = useRef(sample);
  const offsetRef = useRef(0);
  const { updateDragItem, updateDragPosition, dragItem } = useDrag();

  const secsPerMeasure = (60 / bpm) * 4;

  // Load audio buffer & duration
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

  // Compute pixel width based on duration
  const samplePixelWidth = audioState.duration
    ? (audioState.duration / secsPerMeasure) * trackWidth
    : 0;

  // Native drag start: lift sample off track
  const handleNativeDragStart = (e) => {
    // 1) record where inside the sample we grabbed
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    offsetRef.current = offset;

    // 2) remove from track immediately
    editSampleOfSamples(sampleRef.current, true);

    // 3) set global drag item so DragLayer picks it up
    updateDragItem({
      ...sampleRef.current,
      xDragOffset: offset,
      audioBuffer: audioState.buffer,
      audioDuration: audioState.duration,
      path: sampleRef.current.path,
      filename: sampleRef.current.filename,
    });
    updateDragPosition({ x: e.clientX, y: e.clientY });

    // 4) tell the browser it's a move‐type drag
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNativeDrag = (e) => {
      // clientX/Y still valid on drag events
      console.log('drag')
      updateDragPosition({ x: e.clientX, y: e.clientY });
  }
    
  // update drag position
  const handleMouseMove = useCallback(e => {
    if (!dragItem) return;
    updateDragPosition({ x: e.clientX, y: e.clientY });
  }, [dragItem, updateDragPosition]);

  // clear drag on mouse up
  const handleMouseUp = useCallback(e => {
    if (!dragItem) return;
    updateDragItem(null);
  }, [dragItem, updateDragItem]);

  useEventListener('mousemove', handleMouseMove);
  useEventListener('mouseup', handleMouseUp);

  return (
    <div
      className="track-btn-wrapper"
      draggable="true"
      onDragStart={handleNativeDragStart}
      onDrag={handleNativeDrag}
      style={{
        left: `${sample.xPos * trackWidth}px`,
        top: '0px',
        width: `${samplePixelWidth}px`,
      }}
    >
      <button className="remove-track-btn" onClick={() => editSampleOfSamples(sampleRef.current, true)} />
      <button
        className="track-sample-btn"
        draggable="true"
        onDragStart={handleNativeDragStart}
        onDrag={handleNativeDrag}
        style={{ width: `${samplePixelWidth}px` }}
      >
        <span>{sample.filename.slice(0, -4)}</span>
        <WaveSurferWaveform
          url={`/samples/${sample.path}`}
          pixelWidth={samplePixelWidth}
          height={53}
          waveColor="rgba(83, 180, 253, 0.83)"
          progressColor="#036"
        />
      </button>
    </div>
  );
};

export default TrackSample;
