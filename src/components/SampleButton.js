import { useEffect, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const SampleButton = ({ id, handleDragStart, sample, btnClass, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Load the audio file when the component mounts
  useEffect(() => {
    const loadSampleAudio = async () => {
      const fullPath = `./samples/${sample.path}`;
      try {
        const buffer = await loadAudio(fullPath);
        setAudioBuffer(buffer);
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadSampleAudio();
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
        left: offset ? `${offset}px` : ''
      }}
    >
      {sample.filename} {id}
    </button>
  );
};

export default SampleButton;
