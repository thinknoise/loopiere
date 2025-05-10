// hooks/useAudioPlayback.js
import { useState, useRef, useCallback } from "react";
import { getSampleBuffer } from "../utils/audioManager";
import { getAudioContext } from "../utils/audioContextSetup";
import { resumeAudioContext } from "../utils/audioContextSetup";

const useAudioPlayback = () => {
  const audioContext = getAudioContext(); // ✅ hook at top level
  const [playingSources, setPlayingSources] = useState([]);
  const isPlayingRef = useRef(false);

  const playNow = useCallback(
    async (samples, bpm) => {
      const secsPerMeasure = (60 / bpm) * 4;
      const buffers = await Promise.all(samples.map((s) => getSampleBuffer(s)));

      resumeAudioContext();
      const sources = buffers.map((buffer, i) => {
        const src = audioContext.createBufferSource();
        src.buffer = buffer;
        src.connect(audioContext.destination);
        const offset = samples[i].xPos * secsPerMeasure;
        src.start(audioContext.currentTime + offset);
        return src;
      });

      setPlayingSources(sources);
      isPlayingRef.current = true;
    },
    [audioContext]
  );

  const stopAll = useCallback(() => {
    playingSources.forEach((src) => src.stop());
    setPlayingSources([]);
    isPlayingRef.current = false;
  }, [playingSources]);

  return { playNow, stopAll };
};

export default useAudioPlayback;
