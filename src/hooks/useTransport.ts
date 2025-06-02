// src/hooks/useTransport.ts

import { useEffect, useRef, useCallback, use } from "react";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import { useAudioContext } from "../components/AudioContextProvider";
import { useLoopSettings } from "../context/LoopSettingsContext";

/**
 * Callback invoked at each loop boundary.
 */
export type OnLoopCallback = () => void;

/**
 * Transport control return type.
 */
export interface UseTransportResult {
  /** Start the transport loop */
  start(): void;
  /** Stop the transport loop */
  stop(): void;
  /** Indicates whether transport is running */
  isRunning: boolean;
  /** Current loop duration in seconds */
  loopDuration: number;
}

/**
 * Custom hook: schedules loop iterations via requestAnimationFrame.
 * @param onLoopCallback Called each time a loop boundary is reached
 */
export default function useTransport(
  onLoopCallback: OnLoopCallback
): UseTransportResult {
  const audioContext = useAudioContext();
  const { bpm, beatsPerLoop } = useLoopSettings();

  // Mutable refs to track state across frames
  const isRunningRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const loopDurationRef = useRef<number>(
    bpmToSecondsPerLoop(bpm, beatsPerLoop)
  );
  const callbackRef = useRef<OnLoopCallback>(onLoopCallback);

  // Keep latest callback ref in sync
  useEffect(() => {
    callbackRef.current = onLoopCallback;
  }, [onLoopCallback]);

  // Update loop duration when BPM changes
  useEffect(() => {
    loopDurationRef.current = bpmToSecondsPerLoop(bpm, beatsPerLoop);
  }, [beatsPerLoop, bpm]);

  // Main loop function
  const loop = useCallback((): void => {
    if (!isRunningRef.current) return;
    const elapsed = audioContext.currentTime - startTimeRef.current;
    if (elapsed >= loopDurationRef.current) {
      // Advance startTime by one loop
      startTimeRef.current += loopDurationRef.current;
      callbackRef.current();
    }
    rafIdRef.current = requestAnimationFrame(loop);
  }, [audioContext]);

  // Start transport
  const start = useCallback((): void => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      startTimeRef.current = audioContext.currentTime;
      rafIdRef.current = requestAnimationFrame(loop);
    }
  }, [audioContext, loop]);

  // Stop transport
  const stop = useCallback((): void => {
    isRunningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isRunning: isRunningRef.current,
    loopDuration: loopDurationRef.current,
  };
}
