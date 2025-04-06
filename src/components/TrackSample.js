import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveFormDrawing from './WaveFormDrawing'; // Import the WaveFormDrawing component
import { loadAudio } from '../utils/audioManager'; // Import the utility

import '../style/bankSample.css';
import '../style/trackSample.css';

const TrackSample = ({ sample, trackWidth, trackLeft, editSampleOfSamples, bpm, updateSamplesWithNewPosition }) => {

  const canvasRef = useRef(null);  // To reference the canvas element

  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 }); // Initial dummy values

  const sampleRef = useRef(sample);
  const isDraggingRef = useRef(false);

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const secsPerMeasure = (60 / bpm) * 4;


  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `/samples/${sample.path}`;

      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer); // Set audioBuffer state
      setAudioDuration(Math.round(buffer.duration * 10) / 10); // Set duration in seconds
    };

    loadAudioFile();

  }, [sample.path]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    setStartPos({
      x: startPos.x,
      y: 0, // Always on the top of the track it's in
    });
  };

  // Memoize handleMouseMove with useCallback
  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x; // reads the mouse position
    const newXPos = startRelativeLeft + deltaX;

    // Update position during drag
    setDraggingPosition({
      x: newXPos,
      y: 0, // Always on the top of the track it's in
    });
  }, [isDraggingRef, startPos.x, trackLeft]);

  // Memoize handleMouseUp with useCallback
  const handleMouseUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
  
    isDraggingRef.current = false;
    
    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x;
    // Calculate the new X position, clamping it to 0 if it's negative.
    let newX = startRelativeLeft + deltaX;
    newX = Math.max(newX, 0);
    
    // Calculate new xPos as a percentage of trackWidth.
    const newXPositionPercentage = newX / trackWidth;
    updateSamplesWithNewPosition(sampleRef.current.trackSampleId, newXPositionPercentage);
  }, [startPos.x, trackLeft, trackWidth, updateSamplesWithNewPosition]);
  
  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    editSampleOfSamples(sampleRef.current, true);
  };

  // Event listener setup
  useEffect(() => {
    const handleWindowMouseUp = (e) => {
      if (isDraggingRef.current) handleMouseUp(e);
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
        left: `${Math.max(0, isDraggingRef.current ? draggingPosition.x : sample.xPos * trackWidth)}px`,
        top: '0px',
        width: sample.xPos ? `${(audioDuration / secsPerMeasure) * trackWidth}px` : 'auto',
      }}
    >

      <button className='remove-track-btn' onClick={handleRemoveSample}></button>
      <button
        key={sample.trackSampleId}
        className="track-sample-btn"
        onMouseDown={handleMouseDown}
        style={{
          width: audioDuration ? `${(audioDuration/secsPerMeasure) * trackWidth}px` : 'auto',
        }}
      >
        <span>{sample.filename.slice(0, -4)}</span>
        {/* Call the WaveFormDrawing component here */}
        <WaveFormDrawing 
          ref={canvasRef} 
          buffer={audioBuffer} 
          width={audioDuration ? `${(audioDuration/secsPerMeasure) * trackWidth}` : '120'}
          height="53" 
        />
      </button>
    </div>
  );
};

export default TrackSample;
