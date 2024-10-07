import React, { useEffect, useRef, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility

import '../style/sampleButton.css';

const TrackButton = ({ sample, trackRef, updateAllSamples }) => {
  const trackWidth = Math.floor(trackRef.current.getBoundingClientRect().width);
  const trackLeft = Math.floor(trackRef.current.getBoundingClientRect().left);

  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // State to check if it's dragging
  const [position, setPosition] = useState({ x: sample.xPos * trackWidth, y: 0 }); // Initial position based on xPos

  const sampleRef = useRef(sample)

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    const loadAudioFile = async () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create AudioContext
      const fullPath = `./samples/${sample.path}`;

      try {
        // Fetch and decode audio for duration calculation
        const response = await fetch(fullPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        setAudioDuration(Math.round(audioBuffer.duration * 10) / 10); // Set duration in seconds

        // Load audio using the utility (if needed for playback)
        const buffer = await loadAudio(fullPath);
        setAudioBuffer(buffer); // Set audioBuffer state
      } catch (error) {
        console.error('Error loading audio file:', error);
      }
    };

    loadAudioFile();
  }, [sample.path]);

  // Function to play the audio
  const playAudio = () => {
    if (audioBuffer) {
      const context = getAudioContext(); // Use the shared AudioContext
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start();
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true); // Start dragging
    setStartPos({
      x: startPos.x,
      y: 0, // cuz its always on the top of the track its in
    });
  };

  // while dragging on the x-axis
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x;
    const newXPos = startRelativeLeft + deltaX

    // Update position during drag
    setPosition({
      x: newXPos,
      y: 0, // cuz its always on the top of the track its in
    });
  };


  const handleMouseUp = (e) => {
    setIsDragging(false); // Stop dragging

    const startRelativeLeft = startPos.x - trackLeft;
    const deltaX = e.clientX - startPos.x;
    const newXPos = (startRelativeLeft + deltaX) / trackWidth
    console.log('--sample', sampleRef.current, '--new--', newXPos, '-delta', deltaX)

    // Update sample's xPos globally
    const updatedSample = { ...sample, xPos: newXPos };
    updateAllSamples(sampleRef.current, true);
    updateAllSamples(updatedSample);

    // now that the xPos percentage has been set in allSamples
    // set the pixel Position
    // const pixelPostion = newXPos * trackWidth
    // Set the new position after drop
    // setPosition({
    //   x: pixelPostion,
    //   y: 0, // cuz its always on the top of the track its in
    // });
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
  }, [isDragging, position.x]);

  return (
    <button
      key={sample.identifier}
      ref={buttonRef}
      onClick={playAudio} // Play audio when the button is clicked
      className="track-sample-btn"
      onMouseDown={handleMouseDown}
      style={{
        left: `${position.x}px`,
        top: `0px`,
        width: sample.xPos ? `${audioDuration * (916 / 4)}px` : 'auto',
      }}
    >
      {sample.filename} - {Math.round(sample.xPos * trackWidth)}
    </button>
  );
};

export default TrackButton;
