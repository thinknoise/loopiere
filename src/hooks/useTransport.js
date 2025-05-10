// hooks/useTransport.js
import { useEffect, useRef } from "react";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import { useAudioContext } from "../components/AudioContextProvider";

/**
 * Transport hook: schedules loop iterations via requestAnimationFrame.
 * - start(): begin the transport clock
 * - stop(): halt the transport
 * - isRunning: boolean flag for current state
 * - loopDuration: current loop length in seconds
 *
 * @param {number} bpm - beats per minute to calculate loop duration
 * @param {Function} onLoopCallback - called each time a loop boundary is reached
 */
export default function useTransport(bpm, onLoopCallback) {
  const audioContext = useAudioContext();
  const isRunning = useRef(false);
  const rafId = useRef(null);
  const startTimeRef = useRef(0);
  const loopDurationRef = useRef(bpmToSecondsPerLoop(bpm));
  const latestCallback = useRef(onLoopCallback);

  // Keep latest callback ref in sync
  useEffect(() => {
    latestCallback.current = onLoopCallback;
  }, [onLoopCallback]);

  // Update loop duration when BPM changes
  useEffect(() => {
    loopDurationRef.current = bpmToSecondsPerLoop(bpm);
  }, [bpm]);

  // Main loop function
  const loop = () => {
    if (!isRunning.current) return;
    const elapsed = audioContext.currentTime - startTimeRef.current;
    if (elapsed >= loopDurationRef.current) {
      // Move startTime forward by one loop
      startTimeRef.current += loopDurationRef.current;
      // Trigger audio iteration
      console.log("[transport] ◀ loop boundary reached");
      latestCallback.current();
    }
    rafId.current = requestAnimationFrame(loop);
  };

  // Start transport
  const start = () => {
    if (!isRunning.current) {
      console.log("[transport] ▶ starting");
      isRunning.current = true;
      startTimeRef.current = audioContext.currentTime;
      rafId.current = requestAnimationFrame(loop);
    }
  };

  // Stop transport
  const stop = () => {
    console.log("[transport] ■ stopping");
    isRunning.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    start,
    stop,
    isRunning: isRunning.current,
    loopDuration: loopDurationRef.current,
  };
}
