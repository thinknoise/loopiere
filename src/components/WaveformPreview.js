// src/components/WaveformPreview.jsx

import React, { useRef, useEffect } from "react";
import { getWaveformData } from "../utils/waveformUtils";

const WaveformPreview = ({ buffer, width = 500, height = 100 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!buffer) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const waveform = getWaveformData(buffer, width);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#fff"; // You can customize this color
    waveform.forEach((amp, i) => {
      const y = amp * height;
      ctx.fillRect(i, (height - y) / 2, 1, y);
    });
  }, [buffer, width, height]);

  return <canvas ref={ref} width={width} height={height} />;
};

export default WaveformPreview;
