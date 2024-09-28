import { useEffect, useState } from 'react';

const DraggableButton = ({ id, handleDragStart, sample }) => {
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Initialize the AudioContext only once
  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
    
    // Full path including the prepended URL
    const fullPath = `./samples/${sample.path}`;

    console.log('Fetching audio from:', fullPath);

    // Load the audio file from the prepended path
    const loadAudio = async () => {
      try {
        const response = await fetch(fullPath);
        
        // Check if the response is okay and is an audio file
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if content-type is audio
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("audio/")) {
          throw new Error(`Invalid content-type: ${contentType}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    loadAudio();

    // Clean up AudioContext when the component is unmounted
    return () => {
      context.close();
    };
  }, [sample.path]);

  // Function to play the audio
  const playAudio = () => {
    if (audioBuffer && audioContext) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }
  };

  return (
    <button
      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      onDragEnd={() => console.log('dropped')}
      onClick={playAudio} // Play audio when the button is clicked
      className="draggable-btn"
    >
      {sample.filename} {id}
    </button>
  );
};

export default DraggableButton;