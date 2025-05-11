// src/components/CompactWaveform.tsx

import React, { useRef, useEffect, FC } from "react";
import { getWaveformData } from "../utils/waveformUtils";

interface CompactWaveformProps {
  /** The decoded AudioBuffer to visualize */
  buffer: AudioBuffer;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
}

const CompactWaveform: FC<CompactWaveformProps> = ({
  buffer,
  width = 120,
  height = 53,
}) => {
  // Make sure our ref is typed as possibly null
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Use logical OR guards, not bitwise
    if (!buffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const waveform = getWaveformData(buffer, width);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";

    waveform.forEach((amp, i) => {
      const y = amp * height;
      ctx.fillRect(i, (height - y) / 2, 1, y);
    });
  }, [buffer, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default CompactWaveform;
