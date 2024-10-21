import React, { useRef, useEffect, forwardRef } from 'react';

const WaveFormDrawing = forwardRef(({ buffer, width, height }, canvasRef) => {
  
  useEffect(() => {
    if (buffer && canvasRef.current) {
      drawStaticWaveform(buffer);
    }
  }, [buffer, canvasRef, width]);

  // Function to draw the entire waveform without playing the audio
  const drawStaticWaveform = (buffer) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

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
    canvasCtx.lineWidth = 3;
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

  return (
    <canvas ref={canvasRef} width={width} height={height}></canvas>
  );
});

export default WaveFormDrawing;
