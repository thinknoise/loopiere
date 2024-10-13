import { useEffect, useState } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const SampleButton = ({ id, handleDragStart, sample, btnClass, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `./samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer); // Set audioBuffer state
      setAudioDuration(Math.round(buffer.duration * 10) / 10); // Set duration in seconds
    };

    loadAudioFile();
  }, [sample.path]);

  // Function to play the audio
  const playAudio = async () => {
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
      onDragStart={(e) => {
        if (audioBuffer) {
          // Pass audioBuffer if it's available
          // console.log(audioBuffer)
          handleDragStart(e, sample, audioBuffer);
        } else {
          // Handle the case where audioBuffer isn't ready
          console.log('Audio buffer is not yet loaded');
        }
      }}
      onClick={playAudio} // Play audio when the button is clicked
      className="sample-btn"
      style={{
        left: offset ? `${offset}px` : '',
        width: offset ? `${audioDuration * (916/4)}px` : 'auto',
      }}
    >
      {sample.filename} - {offset} {id}
    </button>
  );
};

export default SampleButton;
