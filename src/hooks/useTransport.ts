// src/hooks/useTransport.ts

import { useEffect, useRef, useCallback, useState } from "react";
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

  const isRunningRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const loopDurationRef = useRef<number>(
    bpmToSecondsPerLoop(bpm, beatsPerLoop)
  );
  const callbackRef = useRef<OnLoopCallback>(onLoopCallback);

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    callbackRef.current = onLoopCallback;
  }, [onLoopCallback]);

  useEffect(() => {
    loopDurationRef.current = bpmToSecondsPerLoop(bpm, beatsPerLoop);
  }, [beatsPerLoop, bpm]);

  const loop = useCallback((): void => {
    if (!isRunningRef.current) return;
    const elapsed = audioContext.currentTime - startTimeRef.current;
    if (elapsed >= loopDurationRef.current) {
      startTimeRef.current += loopDurationRef.current;
      if (isRunningRef.current) {
        callbackRef.current();
      }
    }
    if (isRunningRef.current) {
      rafIdRef.current = requestAnimationFrame(loop);
    }
  }, [audioContext]);

  const start = useCallback((): void => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      setIsRunning(true);
      startTimeRef.current = audioContext.currentTime;
      callbackRef.current();
      rafIdRef.current = requestAnimationFrame(loop);
    }
  }, [audioContext, loop]);

  const stop = useCallback((): void => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isRunning,
    loopDuration: loopDurationRef.current,
  };
}
