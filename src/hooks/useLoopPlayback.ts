// src/hooks/useLoopPlayback.ts

import { useRef, useCallback, useState, useEffect } from "react";
import { useLoopSettings } from "../context/LoopSettingsContext";
import { useAudioContext } from "../components/AudioContextProvider";
import type { TrackAudioState } from "../types/audio";
import type { PlaybackSample } from "../types/playback";

/**
 * Builds a single, loopable AudioBuffer that contains the sample at its correct
 * offset within one cycle, and silence everywhere else. When played with .loop=true,
 * it will “play the sample” at X seconds into the cycle then remain silent until
 * the cycle ends, then automatically repeat.
 *
 * @param sample           The original sample descriptor (must have sample.buffer loaded).
 * @param xPosFraction     Where in the loop (0–1) the sample should start.
 * @param cycleDurationSec Total length of one loop cycle, in seconds.
 * @returns A brand-new AudioBuffer of length = cycleDurationSec that has the sample placed at the right offset.
 */
async function buildLoopBuffer(
  sample: PlaybackSample,
  xPosFraction: number,
  cycleDurationSec: number,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  // 1) Ensure the sample has a decoded buffer
  if (!sample.buffer) {
    // In practice, getSampleBuffer(sample) would decode it—but here we assume
    // allSamples passed into useLoopPlayback already have buffer pre-populated.
    throw new Error(`Sample ${sample.filename} missing .buffer`);
  }

  const original = sample.buffer;
  const sampleLength = original.length; // number of frames in the sample
  const sampleRate = original.sampleRate; // e.g. 48000 Hz
  const numChannels = original.numberOfChannels; // channels (mono/stereo)

  // 2) Compute the total number of frames needed for one full cycle:
  const cycleFrameCount = Math.ceil(cycleDurationSec * sampleRate);

  // 3) Compute which frame (0-based) to copy the sample into:
  //    offsetTimeSec = xPosFraction * cycleDurationSec
  //    offsetFrame   = Math.floor(offsetTimeSec * sampleRate)
  const offsetTimeSec = xPosFraction * cycleDurationSec;
  const offsetFrame = Math.floor(offsetTimeSec * sampleRate);

  // 4) Create a brand-new AudioBuffer of length = cycleFrameCount
  const loopBuffer = audioContext.createBuffer(
    numChannels,
    cycleFrameCount,
    sampleRate
  );

  // 5) For each channel, copy the sample’s data into the loopBuffer at offsetFrame
  //    (the rest will remain silence, since the buffer is zero-initialized by default)
  for (let ch = 0; ch < numChannels; ch++) {
    const sourceData = original.getChannelData(ch);
    const targetData = loopBuffer.getChannelData(ch);
    // Copy sampleData[0..sampleLength-1] into targetData[offsetFrame..offsetFrame+sampleLength-1],
    // but ensure we don’t overrun (i.e. sample might be longer than cycle—clip if necessary).
    const maxCopy = Math.min(sampleLength, cycleFrameCount - offsetFrame);
    for (let i = 0; i < maxCopy; i++) {
      targetData[offsetFrame + i] = sourceData[i];
    }
    // If maxCopy < sampleLength, the sample is too long to fit entirely in one cycle.
    // In that case, just copy what fits and let the rest get dropped (or you could truncate).
  }

  return loopBuffer;
}

/**
 * Custom hook: for each placed sample (PlaybackSample), generate a “looped” AudioBuffer
 * that holds the sample at the correct xPos offset within one cycle. Then create one
 * BufferSource per sample, set loop=true, connect it through lowpass→highpass→pan→gain,
 * and .start() it at audioContext.currentTime. Stopping tears down all sources.
 *
 * If the BPM or beatsPerLoop changes mid-play, we rebuild & restart everything.
 */
export function useLoopPlayback(
  allSamples: PlaybackSample[],
  trackAudioState: TrackAudioState
) {
  const audioContext = useAudioContext();
  const { bpm, beatsPerLoop } = useLoopSettings();

  // State so UI knows if loop is running
  const [isPlaying, setIsPlaying] = useState(false);

  // When playing, we keep a ref array of all active BufferSourceNodes, so we can stop them
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Store the current set of “loop buffers” so we can recreate them if BPM changes
  const loopBuffersRef = useRef<Map<number, AudioBuffer>>(new Map());
  //    key is sample.id; value is that sample’s constructed “loopBuffer”

  /**
   * _createAndStartSources()_:
   *   • Given `allSamples` and the current `bpm` & `beatsPerLoop`, build (or reuse)
   *     each sample’s loopBuffer, then create a BufferSource that loops, connect it
   *     through filters→pan→gain, and start it at the current time (audioContext.currentTime).
   */
  const createAndStartSources = useCallback(async () => {
    console.debug("[useLoopPlayback] createAndStartSources called");
    const now = audioContext.currentTime;
    const cycleDurationSec = (60 / bpm) * beatsPerLoop;

    // 1) Build (or reuse) loopBuffer for each placed sample
    const buildPromises: Promise<void>[] = [];
    allSamples.forEach((sample) => {
      if (typeof sample.xPos !== "number" || !sample.buffer) {
        return; // skip unplaced or not yet decoded
      }
      // If we already built a buffer for this sample at this same loop length, reuse it.
      // (We key by sample.id; if loopBuffersRef doesn’t have it or if bpm/loopSize changed,
      // we’ll rebuild.)
      const existing = loopBuffersRef.current.get(sample.id);
      if (
        existing &&
        Math.abs(existing.length / existing.sampleRate - cycleDurationSec) <
          0.000001
      ) {
        // Existing buffer matches this cycle duration—no need to rebuild.
        return;
      }
      // Otherwise, build a fresh loopBuffer:
      const p = buildLoopBuffer(
        sample,
        sample.xPos,
        cycleDurationSec,
        audioContext
      ).then((buf) => {
        loopBuffersRef.current.set(sample.id, buf);
      });
      buildPromises.push(p);
    });

    // Wait for all new loopBuffers to finish building:
    await Promise.all(buildPromises);

    // 2) Now that loopBuffersRef is up-to-date, create + start a BufferSource for each one
    allSamples.forEach((sample) => {
      if (typeof sample.xPos !== "number" || !sample.buffer) {
        return;
      }
      const loopBuf = loopBuffersRef.current.get(sample.id);
      if (!loopBuf) {
        console.warn(
          `[useLoopPlayback] missing loopBuffer for sample ID=${sample.id}`
        );
        return;
      }

      // Create the BufferSource with loop=true
      const srcNode = audioContext.createBufferSource();
      srcNode.buffer = loopBuf;
      srcNode.loop = true;
      srcNode.loopStart = 0;
      srcNode.loopEnd = loopBuf.duration; // full cycle length

      // Connect through filters→pan→gain→destination
      const filterMap = trackAudioState.filters.current;
      if (filterMap) {
        const lowF = filterMap.get(`${sample.trackId}_lowpass`) as
          | BiquadFilterNode
          | undefined;
        const highF = filterMap.get(`${sample.trackId}_highpass`) as
          | BiquadFilterNode
          | undefined;
        const panNode = filterMap.get(`${sample.trackId}_pan`) as
          | StereoPannerNode
          | undefined;
        const gainNode = filterMap.get(`${sample.trackId}_gain`) as
          | GainNode
          | undefined;

        if (lowF && highF && panNode && gainNode) {
          srcNode.connect(lowF);
          lowF.connect(highF);
          highF.connect(panNode);
          panNode.connect(gainNode);
          gainNode.connect(audioContext.destination);
        } else {
          // Fallback: direct connect
          srcNode.connect(audioContext.destination);
        }
      } else {
        srcNode.connect(audioContext.destination);
      }

      // Schedule start immediately (so that within one cycle, the sample plays at its offset).
      srcNode.start(now);

      // Keep track so we can stop() it later
      activeSourcesRef.current.push(srcNode);
    });
  }, [audioContext, bpm, beatsPerLoop, allSamples, trackAudioState.filters]);

  /**
   * startLoop(): Called when the user hits “Play.”
   *   • If already playing, do nothing.
   *   • Otherwise, set isPlaying=true, call createAndStartSources() once,
   *     and leave everything looping natively afterward.
   */
  const startLoop = useCallback(() => {
    console.debug("[useLoopPlayback] startLoop called");
    if (isPlaying) return;
    setIsPlaying(true);
    createAndStartSources().catch((err) => {
      console.error("[useLoopPlayback] createAndStartSources failed:", err);
    });
  }, [isPlaying, createAndStartSources]);

  /**
   * stopLoop(): Called when the user hits “Stop” (or when unmounting).
   *   • If not playing, do nothing.
   *   • Otherwise, set isPlaying=false, then stop() + disconnect() every
   *     active BufferSourceNode and clear the array.
   */
  const stopLoop = useCallback(() => {
    console.debug("[useLoopPlayback] stopLoop called");
    if (!isPlaying) return;
    setIsPlaying(false);
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        /* already stopped or ended */
      }
      try {
        src.disconnect();
      } catch {
        /* ignore */
      }
    });
    activeSourcesRef.current = [];
  }, [isPlaying]);

  /**
   * Whenever BPM or beatsPerLoop changes *while playing*, we need to rebuild
   * all loopBuffers at the new cycleDuration, stop currently playing sources,
   * then re-call createAndStartSources() so everything re-aligns in the new tempo.
   */
  useEffect(() => {
    if (!isPlaying) return;

    // 1) Stop any currently playing sources
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
      try {
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];

    // 2) Clear out old loopBuffers so they get rebuilt:
    loopBuffersRef.current.clear();

    // 3) Create & start new sources at the new tempo
    createAndStartSources().catch((err) => {
      console.error("[useLoopPlayback] rebuild on tempo-change failed:", err);
    });
  }, [bpm, beatsPerLoop, isPlaying]);

  // 4) Cleanup on unmount: if still playing, stop everything
  useEffect(() => {
    return () => {
      if (isPlaying) {
        activeSourcesRef.current.forEach((src) => {
          try {
            src.stop();
          } catch {}
          try {
            src.disconnect();
          } catch {}
        });
        activeSourcesRef.current = [];
        setIsPlaying(false);
      }
    };
  }, [isPlaying]);

  return { startLoop, stopLoop, isPlaying };
}
