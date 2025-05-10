// src/utils/storageUtils.js
import { getAudioContext } from "./audioContextSetup";
import { getSampleBuffer } from "./audioManager";

/**
 * Serialize sample metadata (and recorded PCM) to localStorage.
 * For file-based samples (with path or url), only metadata is saved.
 */
export const saveAllSamplesToLocalStorage = (allSamples, bpm) => {
  const serialized = allSamples
    .map((sample) => {
      // File-based sample: save only metadata
      if (sample.path || sample.url) {
        const { audioBuffer, buffer, ...meta } = sample;
        return { ...meta, __fileBased: true };
      }

      // Recorded sample: serialize PCM
      const audioBuf = sample.audioBuffer ?? sample.buffer;
      if (!audioBuf || typeof audioBuf.numberOfChannels !== "number") {
        return null;
      }
      const numChannels = audioBuf.numberOfChannels;
      const channelData = [];
      for (let ch = 0; ch < numChannels; ch++) {
        channelData.push(Array.from(audioBuf.getChannelData(ch)));
      }
      return {
        ...sample,
        __fileBased: false,
        __pcm: channelData,
        __sampleRate: audioBuf.sampleRate,
        __length: audioBuf.length,
        __numChannels: numChannels,
      };
    })
    .filter((item) => item !== null);

  localStorage.setItem("LoopiereSequences", JSON.stringify(serialized));
  localStorage.setItem("LoopiereBPM", bpm.toString());
};

/**
 * Rebuild sample buffers from localStorage data.
 * File-based samples are reloaded via getSampleBuffer;
 * recorded samples are reconstructed from saved PCM.
 */
export const getAllSamplesFromLocalStorage = async () => {
  const serialized = localStorage.getItem("LoopiereSequences");
  if (!serialized) return [];

  const arr = JSON.parse(serialized);
  return Promise.all(
    arr.map(async (data) => {
      if (data.__fileBased) {
        // reload buffer for file-based sample
        const { __fileBased, ...meta } = data;
        const buffer = await getSampleBuffer(meta);
        return { ...meta, buffer };
      }

      // reconstruct recorded sample from PCM
      const {
        __fileBased,
        __pcm,
        __sampleRate,
        __length,
        __numChannels,
        ...rest
      } = data;
      const audioCtx = getAudioContext();
      const buffer = audioCtx.createBuffer(
        __numChannels,
        __length,
        __sampleRate
      );
      __pcm.forEach((chanArr, ch) => {
        buffer.copyToChannel(new Float32Array(chanArr), ch);
      });
      return { ...rest, buffer };
    })
  );
};
