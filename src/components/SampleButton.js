import { useEffect, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const SampleButton = ({ id, handleDragStart, sample, btnClass, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

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
        setAudioBuffer(buffer);
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

  return (
    <button
      key={id}
      draggable
      onDragStart={(e) => handleDragStart(e, sample)}
      onClick={playAudio} // Play audio when the button is clicked
      className={btnClass ? btnClass : 'sample-btn'}
      style={{
        left: offset ? `${offset}px` : '',
        width:  offset ? `${audioDuration}px` : 'auto',
      }}
    >
      {sample.filename} - {offset} {id}
    </button>
  );
};

export default SampleButton;
