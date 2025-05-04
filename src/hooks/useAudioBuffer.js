import { useState, useEffect } from "react";
import { loadAudio } from "../utils/audioManager";

/**
 * Custom hook to load an audio buffer from a sample object.
 */
export default function useAudioBuffer(sample) {
  const [buffer, setBuffer] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!sample) return;

    // Only accept sample.buffer if it really is an AudioBuffer
    if (sample.buffer && typeof sample.buffer.getChannelData === "function") {
      if (isMounted) {
        setBuffer(sample.buffer);
        setDuration(sample.buffer.duration);
      }
    } else if (sample.path) {
      // Otherwise, load/ decode from disk
      loadAudio(`/samples/${sample.path}`)
        .then((audio) => {
          if (isMounted) {
            setBuffer(audio);
            setDuration(audio.duration);
          }
        })
        .catch((err) =>
          console.error("useAudioBuffer: failed to load", sample.path, err)
        );
    }

    return () => {
      isMounted = false;
    };
  }, [sample]);

  return { buffer, duration };
}
