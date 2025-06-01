// src/hooks/useAudioBuffer.ts

import { useState, useEffect } from "react";
import { getSampleBuffer } from "../utils/audioManager";
import type { BaseSample } from "../types/audio";

export interface UseAudioBufferResult {
  /** Decoded AudioBuffer, or null if not yet loaded */
  buffer: AudioBuffer | null;
  /** Duration of the buffer in seconds, or null if not yet loaded */
  duration: number | null;
}

/**
 * Custom hook to load an AudioBuffer from a sample descriptor.
 * Supports pre-buffered samples, static files, and blob URLs uniformly.
 * @param sample - BaseSample object, may include an existing buffer
 * @returns buffer and duration (seconds) of the loaded AudioBuffer
 */
export default function useAudioBuffer(
  sample: BaseSample
): UseAudioBufferResult {
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBuffer = async (): Promise<void> => {
      try {
        let audioBuf: AudioBuffer;

        if (sample.buffer instanceof AudioBuffer) {
          audioBuf = sample.buffer;
        } else {
          audioBuf = await getSampleBuffer(sample);
        }

        if (!isMounted) return;

        setBuffer(audioBuf);
        setDuration(audioBuf.duration);
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
