import { useEffect, useState, useRef } from 'react';
import { loadAudio, getAudioContext } from '../utils/audioManager'; // Import the utility
import '../style/sampleButton.css';

const SampleButton = ({ id, handleDragStart, sample, btnClass, offset }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const canvasRef = useRef(null);  // To reference the canvas element

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `./samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioBuffer(buffer); // Set audioBuffer state
      setAudioDuration(Math.round(buffer.duration * 10) / 10); // Set duration in seconds
      drawStaticWaveform(buffer); // Draw the waveform once the buffer is loaded
    };

    loadAudioFile();
  }, [sample.path]);

  // Function to draw the entire waveform without playing the audio
  const drawStaticWaveform = (buffer) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear the canvas
    canvasCtx.clearRect(0, 0, width, height);

    // Get the audio data from the buffer (channel 0 in this example)
    const rawData = buffer.getChannelData(0); // For simplicity, only use the first channel
    const sampleRate = rawData.length / width; // Determine how many samples per pixel

    const dataArray = [];
    for (let i = 0; i < width; i++) {
      const sampleStart = Math.floor(i * sampleRate);
      const sampleEnd = Math.floor((i + 1) * sampleRate);
      let sum = 0;
      for (let j = sampleStart; j < sampleEnd; j++) {
        sum += rawData[j] ** 2; // Calculate the squared value to avoid negative amplitudes
      }
      dataArray.push(Math.sqrt(sum / (sampleEnd - sampleStart))); // Get the root mean square (RMS) value
    }

    // Set up drawing parameters
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    // Start drawing the waveform
    canvasCtx.beginPath();

    for (let i = 0; i < width; i++) {
      const amplitude = dataArray[i] * height;
      if (i === 0) {
        canvasCtx.moveTo(i, (height - amplitude));
      } else {
        canvasCtx.lineTo(i, (height - amplitude));
      }
    }

    canvasCtx.stroke(); // Render the waveform
  };

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
          width: offset ? `${audioDuration * (916 / 4)}px` : 'auto',
        }}
      >
        <span>{sample.filename.slice(0, -4)}</span>
        <canvas ref={canvasRef} width="120" height="53"></canvas>
      </button>
  );
};

export default SampleButton;
