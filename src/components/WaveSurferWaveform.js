// src/components/WaveSurferWaveform.js
import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveSurferWaveform = ({
  url,
  pixelWidth,            // new prop for container width in pixels
  height = 53,
  waveColor = 'rgba(83, 180, 253, 0.83)',
  progressColor = '#036',
  cursorColor = '#333',
  normalize = true,
  responsive = false,     // turn off auto‑resize so we control width
}) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // set the container's width before creating Wavesurfer
    containerRef.current.style.width = `${pixelWidth}px`;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      height,
      normalize,
      responsive,
    });

    // suppress aborts
    ws.on('error', (err) => {
      if (err.name !== 'AbortError') console.error(err);
    });

    const p = ws.load(url);
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });
    }

    wavesurferRef.current = ws;
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [url, pixelWidth, waveColor, progressColor, cursorColor, height, normalize]);

  return <div ref={containerRef} />;
};

export default WaveSurferWaveform;
