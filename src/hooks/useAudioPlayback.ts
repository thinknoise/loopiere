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
  playNow(
    samples: PlaybackSample[],
    bpm: number,
    trackFiltersRef: React.RefObject<Map<number, BiquadFilterNode>>,
    trackFrequencies: Record<number, number>
  ): Promise<void>;
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
    async (
      samples: PlaybackSample[],
      bpm: number,
      trackFiltersRef: React.RefObject<Map<number, BiquadFilterNode>>,
      trackFrequencies: Record<number, number>
    ): Promise<void> => {
      const secsPerLoop = (60 / bpm) * 4;

      // Preload all buffers
      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      resumeAudioContext();
      const startTime = audioContext.currentTime;

      // Create a filter node for each track you want to process (e.g., trackId 0)
      trackFiltersRef.current?.clear();

      samples.forEach((sample) => {
        const trackId = sample.trackId;
        if (trackId != null && !trackFiltersRef.current?.has(trackId)) {
          const filter = audioContext.createBiquadFilter();
          filter.type = "lowpass";

          const initialFreq = trackFrequencies[trackId] ?? 800;
          filter.frequency.setValueAtTime(
            initialFreq,
            audioContext.currentTime
          );

          trackFiltersRef.current?.set(trackId, filter);
          console.log(
            `Create filter on track ${trackId} w/freq ${initialFreq}`
          );
        }
      });

      // Connect each sample through its track's filter (if any)
      const sources = buffers.map((buffer, idx) => {
        const sample = samples[idx];
        const src = audioContext.createBufferSource();
        src.buffer = buffer;

        const filter =
          sample.trackId != null
            ? trackFiltersRef.current?.get(sample.trackId)
            : null;
        const outputNode = filter ?? audioContext.destination;
        src.connect(outputNode);

        src.connect(outputNode);

        const offset = sample.xPos! * secsPerLoop;
        src.start(startTime + offset);
        src.stop(startTime + secsPerLoop);
        return src;
      });

      // Connect all filters to the destination
      for (const node of trackFiltersRef.current?.values() ?? []) {
        node.connect(audioContext.destination);
      }

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
