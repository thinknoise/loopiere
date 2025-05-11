// src/hooks/useAudioPlayback.ts

import { useState, useCallback } from "react";
import { getSampleBuffer, SampleDescriptor } from "../utils/audioManager";
import { getAudioContext } from "../utils/audioContextSetup";
import { resumeAudioContext } from "../utils/audioContextSetup";

/**
 * Extended sample type with xPos for playback scheduling.
 */
export interface PlaybackSample extends SampleDescriptor {
  /** Fractional position (0–1) representing start point in loop */
  xPos: number;
}

/**
 * Hook return type for audio playback controls.
 */
export interface UseAudioPlaybackResult {
  /**
   * Play the provided samples based on BPM-derived loop timing.
   * @param samples Array of samples with xPos fraction
   * @param bpm Beats per minute for timing calculations
   */
  playNow(samples: PlaybackSample[], bpm: number): Promise<void>;
  /**
   * Immediately stop and clear all scheduled playback sources.
   */
  stopAll(): void;
}

/**
 * Custom hook for playing audio samples: use playNow to start playback; stopAll stops and resets.
 * Looping scheduling is handled externally (e.g., via transport controls).
 */
export default function useAudioPlayback(): UseAudioPlaybackResult {
  const audioContext = getAudioContext();
  const [playingSources, setPlayingSources] = useState<AudioBufferSourceNode[]>(
    []
  );

  const playNow = useCallback(
    async (samples: PlaybackSample[], bpm: number): Promise<void> => {
      const secsPerLoop = (60 / bpm) * 4;

      // Preload all buffers
      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      resumeAudioContext();
      const startTime = audioContext.currentTime;

      // Schedule each buffer source
      const sources = buffers.map((buffer, idx) => {
        const src = audioContext.createBufferSource();
        src.buffer = buffer;
        src.connect(audioContext.destination);
        const offset = samples[idx].xPos * secsPerLoop;
        src.start(startTime + offset);
        src.stop(startTime + secsPerLoop);
        return src;
      });

      setPlayingSources(sources);
    },
    [audioContext]
  );

  const stopAll = useCallback((): void => {
    playingSources.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore already stopped sources
      }
    });
    setPlayingSources([]);
  }, [playingSources]);

  return { playNow, stopAll };
}
