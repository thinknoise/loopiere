import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/bankSample.css';

const TrackSample = ({ sample, trackRef, updateAllSamples }) => {
  const trackWidth = Math.floor(trackRef.current.getBoundingClientRect().width);
  const trackLeft = Math.floor(trackRef.current.getBoundingClientRect().left);

  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // State to check if it's dragging
  const [position, setPosition] = useState({ x: sample.xPos * trackWidth, y: 0 }); // Initial position based on xPos

  const sampleRef = useRef(sample);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

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

  // Function to play the audio 
  const playAudio = useCallback(() => {
    if (audioBuffer) {
      const context = getAudioContext(); // Use the shared AudioContext
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start();
    }
  }, [audioBuffer]);

  const handleMouseDown = (e) => {
    setIsDragging(true); // Start dragging
    setStartPos({
      x: startPos.x,
      y: 0, // Always on the top of the track it's in
    });
  };

  // Memoize handleMouseMove with useCallback
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

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
    setIsDragging(false); // Stop dragging

    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x;
    const newXPos = (startRelativeLeft + deltaX) / trackWidth;

    // Update sample's xPos globally
    const updatedSample = { ...sample, xPos: newXPos };
    updateAllSamples(sampleRef.current, true); // Remove the old position
    updateAllSamples(updatedSample); // Add the new position
    // is sequence is playing
    // don't play this
    if (false) {
      playAudio()
    }
  }, [startPos.x, trackLeft, trackWidth, sample, updateAllSamples, playAudio]);

  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    updateAllSamples(sampleRef.current, true);
  };

  // Attach and clean up event listeners for mousemove and mouseup
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className='track-btn-wrapper'
      style={{
        left: `${position.x}px`,
        top: `0px`,
      }}
    >
      <button
        key={sample.identifier}
        ref={buttonRef}
        className="track-sample-btn"
        onMouseDown={handleMouseDown}
        style={{
          width: sample.xPos ? `${audioDuration * (916 / 4)}px` : 'auto',
        }}
        >
        {sample.filename}
      </button>
      <button className='remove-track-btn' onClick={handleRemoveSample}>x</button>
    </div>
  );
};

export default TrackSample;
