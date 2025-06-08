// src/hooks/useAudioPlayback.ts

import { useCallback, useRef } from "react";
import type { TrackSample } from "../types/audio";
import { getSampleBuffer } from "../utils/audioManager";
import {
  getAudioContext,
  resumeAudioContext,
} from "../utils/audioContextSetup";
import { useLoopSettings } from "../context/LoopSettingsContext";

/**
 * Alias for playback sample — identical to TrackSample since xPos is core.
 */
export type PlaybackSample = TrackSample;

/**
 * Shapes the shared audio-node state for each track,
 * including volume, pan, filters.
 */
export interface TrackAudioStateParams {
  /** Ref to a map of all persistent AudioNodes by key ("{trackId}_gain", etc.) */
  filters: React.RefObject<Map<string, AudioNode>>;
  /** lowpass cutoff per track */
  frequencies: Record<number, number>;
  /** highpass cutoff per track */
  highpassFrequencies: Record<number, number>;
  /** user‐driven volume per track */
  gains?: Record<number, number>;
  /** user‐driven pan per track */
  pans?: Record<number, number>;
  /** bypass state for lowpass/highpass filters */
  bypasses: {
    lowpass: Record<number, boolean>;
    highpass: Record<number, boolean>;
  };
  gainNodes: React.RefObject<Map<number, GainNode>>;
  panNodes: React.RefObject<Map<number, StereoPannerNode>>;
  highpassNodes: React.RefObject<Map<number, BiquadFilterNode>>;
  lowpassNodes: React.RefObject<Map<number, BiquadFilterNode>>;
}

/**
 * What this hook gives you:
 * - playNow: schedule & play your 4-beat loops through gain→pan→filters
 * - stopAll: kill any ongoing sources
 */
export interface UseAudioPlaybackResult {
  playNow(
    samples: PlaybackSample[],
    bpm: number,
    trackAudioState: TrackAudioStateParams
  ): Promise<void>;
  stopAll(): void;
}

export default function useAudioPlayback(): UseAudioPlaybackResult {
  const audioContext = getAudioContext();
  const { beatsPerLoop } = useLoopSettings();
  const playingSources = useRef<AudioBufferSourceNode[]>([]);

  // ─── playNow: schedule n-Beats Per Loop ───────────────────────────
  const playNow = useCallback(
    async (
      samples: PlaybackSample[],
      bpm: number,
      trackAudioState: TrackAudioStateParams
    ) => {
      // unlock context if needed
      await resumeAudioContext();

      const startTime = audioContext.currentTime;
      const loopLength = (60 / bpm) * beatsPerLoop;

      // decode all samples
      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      // schedule each sample into the shared node graph
      const sources = samples.map((sample, idx) => {
        const buffer = buffers[idx];
        const trackId = sample.trackId!;
        const offset = (sample.xPos ?? 0) * loopLength;

        // create the BufferSource
        const src = audioContext.createBufferSource();
        src.buffer = buffer;

        // ─── persistent gain ────────────────────────
        let gainNode = trackAudioState.gainNodes.current.get(trackId);
        if (!gainNode) {
          gainNode = audioContext.createGain();
          trackAudioState.gainNodes.current.set(trackId, gainNode);
        }
        gainNode.gain.setValueAtTime(
          trackAudioState.gains?.[trackId] ?? 1,
          startTime
        );

        // ─── persistent pan ─────────────────────────
        let panNode = trackAudioState.panNodes.current.get(trackId);
        if (!panNode) {
          panNode = audioContext.createStereoPanner();
          trackAudioState.panNodes.current.set(trackId, panNode);
        }
        panNode.pan.setValueAtTime(
          trackAudioState.pans?.[trackId] ?? 0,
          startTime
        );

        // ─── persistent highpass ────────────────────
        let highpassNode = trackAudioState.highpassNodes.current.get(trackId);
        if (!highpassNode) {
          highpassNode = audioContext.createBiquadFilter();
          highpassNode.type = "highpass";
          trackAudioState.highpassNodes.current.set(trackId, highpassNode);
        }
        highpassNode.frequency.setValueAtTime(
          trackAudioState.highpassFrequencies[trackId] ?? 0,
          startTime
        );

        // ─── persistent lowpass ─────────────────────
        let lowpassNode = trackAudioState.lowpassNodes.current.get(trackId);
        if (!lowpassNode) {
          lowpassNode = audioContext.createBiquadFilter();
          lowpassNode.type = "lowpass";
          trackAudioState.lowpassNodes.current.set(trackId, lowpassNode);
        }
        lowpassNode.frequency.setValueAtTime(
          trackAudioState.frequencies[trackId] ?? audioContext.sampleRate / 2,
          startTime
        );

        // Always disconnect both filters before rebuilding chain
        try {
          highpassNode.disconnect();
        } catch {}
        try {
          lowpassNode.disconnect();
        } catch {}

        let currentNode: AudioNode = src;

        currentNode.connect(gainNode);
        currentNode = gainNode;

        currentNode.connect(panNode);
        currentNode = panNode;

        // Reconnect only if NOT bypassed
        if (!trackAudioState.bypasses?.highpass[trackId]) {
          currentNode.connect(highpassNode);
          currentNode = highpassNode;
        }

        if (!trackAudioState.bypasses?.lowpass[trackId]) {
          currentNode.connect(lowpassNode);
          currentNode = lowpassNode;
        }

        currentNode.connect(audioContext.destination);

        // schedule start/stop
        src.start(startTime + offset);
        src.stop(startTime + offset + loopLength);

        return src;
      });

      playingSources.current = sources;
    },
    [audioContext, beatsPerLoop]
  );

  // ─── stopAll: kill any playing sources ────────────────────────
  const stopAll = useCallback(() => {
    playingSources.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        console.warn("failed to stop source", e);
      }
    });
    playingSources.current = [];
  }, [playingSources]);

  return { playNow, stopAll };
}
