// WaveFormDrawing.js
import React, { useRef, useEffect, forwardRef } from 'react';

const WaveFormDrawing = forwardRef(({ buffer, width, height }, forwardedRef) => {
  // If no ref was forwarded, use an internal one
  const localRef = useRef(null);
  const canvasRef = forwardedRef || localRef;

  useEffect(() => {
    if (!buffer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // drawStaticWaveform now safe to run
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, width, height);

    const rawData = buffer.getChannelData(0);
    const sampleRate = rawData.length / width;
    const dataArray = [];

    for (let i = 0; i < width; i++) {
      const start = Math.floor(i * sampleRate);
      const end = Math.floor((i + 1) * sampleRate);
      let sum = 0;
      for (let j = start; j < end; j++) sum += rawData[j] ** 2;
      dataArray.push(Math.sqrt(sum / (end - start)));
    }

    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.beginPath();

    dataArray.forEach((amp, i) => {
      const y = height - amp * height;
      i === 0 ? canvasCtx.moveTo(i, y) : canvasCtx.lineTo(i, y);
    });

    canvasCtx.stroke();
  }, [buffer, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
});

export default WaveFormDrawing;
