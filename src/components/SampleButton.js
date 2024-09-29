import { useEffect, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const SampleButton = ({ id, handleDragStart, sample, btnClass }) => {
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

  const handleDropped = (sample) => {
    console.log('Dropped:', sample);
  };

  return (
    <button
      key={id}
      draggable
      onDragStart={(e) => handleDragStart(e, sample)}
      onDragEnd={() => handleDropped(sample)}
      onClick={playAudio} // Play audio when the button is clicked
      className={`sample-btn ${btnClass}`}
    >
      {sample.filename} {id}
    </button>
  );
};

export default SampleButton;
