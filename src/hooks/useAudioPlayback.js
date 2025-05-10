// hooks/useAudioPlayback.js
import { useState, useRef, useCallback } from "react";
import { getSampleBuffer } from "../utils/audioManager";
import { getAudioContext } from "../utils/audioContextSetup";
import { resumeAudioContext } from "../utils/audioContextSetup";

/**
 * Custom hook for playing audio samples: playNow starts playback; stopAll stops and resets.
 * Looping must be scheduled externally (e.g., via transport or parent loop logic).
 */
const useAudioPlayback = () => {
  const audioContext = getAudioContext();
  const [playingSources, setPlayingSources] = useState([]);

  /**
   * Play samples once according to BPM-derived loop length.
   * @param {Array} samples - array of { xPos (beats), ...sample data }
   * @param {number} bpm - beats per minute for timing
   */
  const playNow = useCallback(
    async (samples, bpm) => {
      const secsPerLoop = (60 / bpm) * 4;

      // Preload buffers
      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      resumeAudioContext();
      const startTime = audioContext.currentTime;

      // Schedule each sample playback
      const sources = buffers.map((buffer, i) => {
        const src = audioContext.createBufferSource();
        src.buffer = buffer;
        src.connect(audioContext.destination);
        const offset =
          (typeof samples[i].xPos === "number" ? samples[i].xPos : 0) *
          secsPerLoop;
        src.start(startTime + offset);
        src.stop(startTime + secsPerLoop);
        return src;
      });
      console.log("[playback] sources", sources);
      setPlayingSources(sources);
    },
    [audioContext]
  );

  /**
   * Stop all active playback sources and reset play state.
   */
  const stopAll = useCallback(() => {
    playingSources.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    setPlayingSources([]);
  }, [playingSources]);

  return { playNow, stopAll };
};

export default useAudioPlayback;
