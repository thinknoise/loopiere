// hooks/useAudioPlayback.js
import { useState, useRef } from "react";
import { getAudioContext, getSampleBuffer } from "../utils/audioManager";

const useAudioPlayback = () => {
  const [playingSources, setPlayingSources] = useState([]);
  const isPlayingRef = useRef(false);

  const playNow = async (samples, bpm) => {
    const secsPerMeasure = (60 / bpm) * 4;

    const audioBuffers = await Promise.all(
      samples.map((sample) => getSampleBuffer(sample))
    );

    const context = getAudioContext();
    const sources = [];

    audioBuffers.forEach((buffer, index) => {
      const source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = buffer;

      const offsetTime = samples[index].xPos * secsPerMeasure;
      source.start(context.currentTime + offsetTime);
      sources.push(source);
    });

    setPlayingSources(sources);
    isPlayingRef.current = true;
  };

  const stopAll = () => {
    playingSources.forEach((source) => source.stop());
    setPlayingSources([]);
    isPlayingRef.current = false;
  };

  return { playNow, stopAll };
};

export default useAudioPlayback;
