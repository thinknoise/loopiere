// src/hooks/useAudioPlayback.ts

import { useState, useCallback, useRef } from "react";
import type { TrackSample } from "../types/audio";
import { getSampleBuffer } from "../utils/audioManager";
import {
  getAudioContext,
  resumeAudioContext,
} from "../utils/audioContextSetup";

/**
 * Alias for playback sample — identical to TrackSample since xPos is core.
 */
export type PlaybackSample = TrackSample;

/**
 * Shapes the shared audio-node state for each track,
 * including volume, pan, filters.
 */
export interface TrackAudioState {
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
    trackAudioState: TrackAudioState
  ): Promise<void>;
  stopAll(): void;
}

export default function useAudioPlayback({
  bpm,
  beatsPerLoop,
}: {
  bpm: number;
  beatsPerLoop: number;
}): UseAudioPlaybackResult {
  const audioContext = getAudioContext();
  const [playingSources, setPlayingSources] = useState<AudioBufferSourceNode[]>(
    []
  );

  // ─── persistent node maps ──────────────────────────────────────
  const gainNodes = useRef<Map<number, GainNode>>(new Map());
  const panNodes = useRef<Map<number, StereoPannerNode>>(new Map());
  const highpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());
  const lowpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());

  /** get-or-create a node in the given map */
  function getTrackNode<T extends AudioNode>(
    map: Map<number, T>,
    createNode: () => T,
    key: string,
    trackId: number,
    refMap: React.RefObject<Map<string, AudioNode>>
  ): T {
    let node = map.get(trackId);
    if (!node) {
      node = createNode();
      map.set(trackId, node);
      // register it so your sliders can find it:
      refMap.current?.set(key, node);
    }
    return node;
  }

  // ─── playNow: schedule a 4-beat loop ───────────────────────────
  const playNow = useCallback(
    async (
      samples: PlaybackSample[],
      bpm: number,
      trackAudioState: TrackAudioState
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

        console.debug(
          `xPos ${(sample.xPos * 100).toFixed(
            2
          )} on track ${trackId} at offset ${offset}s`,
          loopLength.toFixed(2)
        );
        // create the BufferSource
        const src = audioContext.createBufferSource();
        src.buffer = buffer;

        // ─── persistent gain ────────────────────────
        const gainNode = getTrackNode(
          gainNodes.current,
          () => audioContext.createGain(),
          `${trackId}_gain`,
          trackId,
          trackAudioState.filters
        );
        gainNode.gain.setValueAtTime(
          trackAudioState.gains?.[trackId] ?? 1,
          startTime
        );

        // ─── persistent pan ─────────────────────────
        const panNode = getTrackNode(
          panNodes.current,
          () => audioContext.createStereoPanner(),
          `${trackId}_pan`,
          trackId,
          trackAudioState.filters
        );
        panNode.pan.setValueAtTime(
          trackAudioState.pans?.[trackId] ?? 0,
          startTime
        );

        // ─── persistent highpass ────────────────────
        const highFilter = getTrackNode(
          highpassNodes.current,
          () => {
            const f = audioContext.createBiquadFilter();
            f.type = "highpass";
            return f;
          },
          `${trackId}_highpass`,
          trackId,
          trackAudioState.filters
        );
        highFilter.frequency.setValueAtTime(
          trackAudioState.highpassFrequencies[trackId] ?? 0,
          startTime
        );

        // ─── persistent lowpass ─────────────────────
        const lowFilter = getTrackNode(
          lowpassNodes.current,
          () => {
            const f = audioContext.createBiquadFilter();
            f.type = "lowpass";
            return f;
          },
          `${trackId}_lowpass`,
          trackId,
          trackAudioState.filters
        );
        lowFilter.frequency.setValueAtTime(
          trackAudioState.frequencies[trackId] ?? audioContext.sampleRate / 2,
          startTime
        );

        // ─── chain it all: source → gain → pan → hp → lp → out
        src
          .connect(gainNode)
          .connect(panNode)
          .connect(highFilter)
          .connect(lowFilter)
          .connect(audioContext.destination);

        // schedule start/stop in the 4-beat loop
        src.start(startTime + offset);
        src.stop(startTime + offset + loopLength);

        return src;
      });

      setPlayingSources(sources);
    },
    [audioContext, beatsPerLoop]
  );

  // ─── stopAll: kill any playing sources ────────────────────────
  const stopAll = useCallback(() => {
    playingSources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    setPlayingSources([]);
  }, [playingSources]);

  return { playNow, stopAll };
}
