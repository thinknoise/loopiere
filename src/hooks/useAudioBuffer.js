import { useState, useEffect } from "react";
import { getSampleBuffer } from "../utils/audioManager";

/**
 * Custom hook to load an audio buffer from a sample object.
 * Supports pre-buffered samples, static files, and blob URLs uniformly.
 */
export default function useAudioBuffer(sample) {
  const [buffer, setBuffer] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!sample) return;

    const loadBuffer = async () => {
      try {
        let audioBuf;
        // If sample already has an AudioBuffer, use it
        if (
          sample.buffer &&
          typeof sample.buffer.getChannelData === "function"
        ) {
          audioBuf = sample.buffer;
        } else {
          // Otherwise, delegate to getSampleBuffer (handles URLs, paths, blobs)
          audioBuf = await getSampleBuffer(sample);
        }
        if (isMounted) {
          setBuffer(audioBuf);
          setDuration(audioBuf.duration);
        }
      } catch (err) {
        console.error("useAudioBuffer: failed to load sample", sample, err);
      }
    };

    loadBuffer();

    return () => {
      isMounted = false;
    };
  }, [sample]);

  return { buffer, duration };
}
