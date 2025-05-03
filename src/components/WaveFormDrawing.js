import React, { useEffect, forwardRef } from "react";

const WaveFormDrawing = forwardRef(({ buffer, width, height }, canvasRef) => {
  // ✅ Define before useEffect to satisfy ESLint
  const drawStaticWaveform = (buffer) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");

    canvasCtx.clearRect(0, 0, width, height);

    const rawData = buffer.getChannelData(0);
    const sampleRate = rawData.length / width;

    const dataArray = [];
    for (let i = 0; i < width; i++) {
      const sampleStart = Math.floor(i * sampleRate);
      const sampleEnd = Math.floor((i + 1) * sampleRate);
      let sum = 0;
      for (let j = sampleStart; j < sampleEnd; j++) {
        sum += rawData[j] ** 2;
      }
      dataArray.push(Math.sqrt(sum / (sampleEnd - sampleStart)));
    }

    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();

    for (let i = 0; i < width; i++) {
      const amplitude = dataArray[i] * height;
      if (i === 0) {
        canvasCtx.moveTo(i, height - amplitude);
      } else {
        canvasCtx.lineTo(i, height - amplitude);
      }
    }

    canvasCtx.stroke();
  };

  useEffect(() => {
    if (buffer && canvasRef.current) {
      drawStaticWaveform(buffer);
    }
  }, [buffer, canvasRef, width, height]); // ✅ include all dependencies used inside

  return <canvas ref={canvasRef} width={width} height={height}></canvas>;
});

export default WaveFormDrawing;
