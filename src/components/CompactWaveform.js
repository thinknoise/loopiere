import React, { useRef, useEffect } from "react";
import { getWaveformData } from "../utils/waveformUtils";

const CompactWaveform = ({ buffer, width = 120, height = 53 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!buffer || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const waveform = getWaveformData(buffer, width);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff"; // customize as needed

    waveform.forEach((amp, i) => {
      const y = amp * height;
      ctx.fillRect(i, (height - y) / 2, 1, y);
    });
  }, [buffer, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default CompactWaveform;
