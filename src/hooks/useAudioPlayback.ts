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
    trackAudioState: TrackAudioState
  ): Promise<void>;
  /**
   * Immediately stop and clear all scheduled playback sources.
   */
  stopAll(): void;
}

export interface TrackAudioState {
  filters: React.RefObject<Map<number, BiquadFilterNode>>;
  frequencies: Record<number, number>;
  // Prepare for future expansion
  gains?: Record<number, number>;
  pans?: Record<number, number>;
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
      trackAudioState: TrackAudioState
    ): Promise<void> => {
      const { filters: trackFiltersRef, frequencies: trackFrequencies } =
        trackAudioState;
      trackFiltersRef.current?.clear();

      const startTime = audioContext.currentTime;

      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      const sources = buffers.map((buffer, idx) => {
        const sample = samples[idx];
        const trackId = sample.trackId!;
        const offset = sample.xPos! * ((60 / bpm) * 4);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        const freq = trackFrequencies[trackId] ?? 800;
        filter.frequency.setValueAtTime(freq, audioContext.currentTime);
        trackFiltersRef.current?.set(trackId, filter);

        source.connect(filter);
        filter.connect(audioContext.destination);

        source.start(startTime + offset);
        source.stop(startTime + (60 / bpm) * 4);

        return source;
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
