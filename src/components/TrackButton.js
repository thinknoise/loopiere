import React, { useEffect, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const TrackButton = ({ id, sample, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // State to check if it's dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });

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
    
    setPosition({
      x: offset,
    })
  }, [sample.path, offset]);

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
    console.log(e.clientX)
  };
  const handleMouseUp = (e) => {
    setIsDragging(false); // Start dragging
    // update xPos of that sample
    console.log(e.clientX)
  };

  const handleMouseMove = (e) => {
    const parentTop = e.target.parentElement.offsetTop;
    console.log('Parent offsetTop:', parentTop);
        setPosition({
      x: e.clientX - 100,
    })
  };


    // Attach and clean up event listeners for mousemove and mouseup
    React.useEffect(() => {
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
    }, [isDragging, position]);
  
  return (
    <button
      key={id}
      onClick={playAudio} // Play audio when the button is clicked
      className="track-sample-btn draggable"
      onMouseDown={handleMouseDown}

      style={{
        left: position.x ? `${position.x}px` : `${offset}px`,
        top: position.y ? `${position.y}px` : `0spx`,
        width: offset ? `${audioDuration * (916/4)}px` : 'auto',
      }}
    >
      {sample.filename} - {offset} {id}
    </button>
  );
};

export default TrackButton;
