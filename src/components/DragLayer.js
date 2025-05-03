// DragLayer.js
import React from 'react';
import ReactDOM from 'react-dom';
import { useDrag } from '../context/DragContext';
import WaveSurferWaveform from './WaveSurferWaveform';
import useEventListener from '../hooks/useEventListener';
import '../style/trackSample.css';

const DragLayer = () => {
  const { dragItem, dragPosition, updateDragPosition } = useDrag();

  // Attach global dragover listener unconditionally
  useEventListener('dragover', (e) => {
    // Only update position if we're actually dragging an item
    if (dragItem) {
      updateDragPosition({ x: e.clientX, y: e.clientY });
    }
  });

  // Now it's safe to early-return
  if (!dragItem) return null;
  const mountNode = document.getElementById('drag-layer');
  if (!mountNode) return null;

  const BEATS_PER_MEASURE = 4;
  const TOTAL_TRACK_WIDTH = 916;
  const previewWidth = dragItem.audioDuration
    ? `${(dragItem.audioDuration / BEATS_PER_MEASURE) * TOTAL_TRACK_WIDTH}px`
    : 'auto';

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        left: dragPosition.x,
        top: dragPosition.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      }}
    >
      <div
        className="track-sample-btn"
        style={{
          width: previewWidth,
          backgroundColor: 'rgba(83, 180, 253, 0.9)',
          border: '1px solid #000',
          borderRadius: '5px',
          padding: '5px',
        }}
      >
        <span>{dragItem.filename.slice(0, -4)}</span>
        <WaveSurferWaveform
          url={`/samples/${dragItem.path}`}
          pixelWidth={parseFloat(previewWidth)}
          height={53}
          waveColor="rgba(0,0,0,0.3)"
          progressColor="rgba(0,0,0,0.1)"
          normalize
          responsive
        />
      </div>
    </div>,
    mountNode
  );
};

export default DragLayer;
