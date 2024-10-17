import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility

import '../style/bankSample.css';

const TrackSample = ({ sample, trackRef, updateAllSamples, bpm }) => {
  const trackWidth = Math.floor(trackRef.current.getBoundingClientRect().width);
  const trackLeft = Math.floor(trackRef.current.getBoundingClientRect().left);

  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

  
  const [isDragging, setIsDragging] = useState(false); // State to check if it's dragging
  const [position, setPosition] = useState({ x: sample.xPos * trackWidth, y: 0 }); // Initial position based on xPos

  const sampleRef = useRef(sample);
  const isDraggingRef = useRef(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const measurePerSecond = (60 / bpm) * 4;


  useEffect(() => {
    const loadAudioFile = async () => {
      // do this in button also
      // needs to getAudioContext else do this
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
    const deltaX = e.clientX - startPos.x;
    const newXPos = startRelativeLeft + deltaX;

    // Update position during drag
    setPosition({
      x: newXPos,
      y: 0, // Always on the top of the track it's in
    });
  }, [isDragging, startPos.x, trackLeft]);

  // Memoize handleMouseUp with useCallback
  const handleMouseUp = useCallback((e) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x;
    const newXPos = (startRelativeLeft + deltaX) / trackWidth;

    // Update sample's xPos globally
    const updatedSample = { ...sampleRef.current, xPos: newXPos };

    /// maybe make a function that does what I want to have happen
    /// set the xpos of the sampleRef.current in the allSamples array

    updateAllSamples(sampleRef.current, true); // Remove the old position
    updateAllSamples(updatedSample); // Add the new position
  }, [startPos.x, trackLeft, trackWidth, sample, updateAllSamples]);

  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    updateAllSamples(sampleRef.current, true);
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
    <div className='track-btn-wrapper'
      style={{
        left: `${position.x}px`,
        top: `0px`,
      }}
    >
      <button
        key={sample.trackSampleId}
        ref={buttonRef}
        className="track-sample-btn"
        onMouseDown={handleMouseDown}
        style={{
          width: sample.xPos ? `${(audioDuration/measurePerSecond) * trackWidth}px` : 'auto',
        }}
        >
        {sample.filename}
      </button>
      <button className='remove-track-btn' onClick={handleRemoveSample}></button>
    </div>
  );
};

export default TrackSample;
