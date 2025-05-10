// useTransport.js
import { useEffect, useRef } from "react";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import { useAudioContext } from "../components/AudioContextProvider";

export default function useTransport(bpm, onLoopCallback) {
  const isRunning = useRef(false);
  const rafId = useRef(null);
  const startTimeRef = useRef(0);
  const loopDurationRef = useRef(bpmToSecondsPerLoop(bpm));
  const latestCallback = useRef(onLoopCallback);

  // Update loop duration when BPM changes
  useEffect(() => {
    loopDurationRef.current = bpmToSecondsPerLoop(bpm);
  }, [bpm]);

  // Track latest callback to avoid stale closure
  useEffect(() => {
    latestCallback.current = onLoopCallback;
  }, [onLoopCallback]);

  const loop = () => {
    const now = useAudioContext.currentTime;
    const elapsed = now - startTimeRef.current;

    if (elapsed >= loopDurationRef.current) {
      latestCallback.current?.();
      startTimeRef.current += loopDurationRef.current;
    }

    if (isRunning.current) {
      rafId.current = requestAnimationFrame(loop);
    }
  };

  const start = () => {
    if (!isRunning.current) {
      console.log("[transport] ▶ starting");
      isRunning.current = true;
      startTimeRef.current = useAudioContext.currentTime;
      rafId.current = requestAnimationFrame(loop);
    }
  };

  const stop = () => {
    isRunning.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  useEffect(() => stop, []);

  return {
    start,
    stop,
    isRunning: isRunning.current,
    loopDuration: loopDurationRef.current,
  };
}
