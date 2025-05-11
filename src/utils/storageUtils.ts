// src/utils/storageUtils.ts

import { getAudioContext } from "./audioContextSetup";
import { getSampleBuffer } from "./audioManager";
import type { SampleDescriptor } from "./audioManager";

/**
 * Serialize sample metadata (and recorded PCM) to localStorage.
 * For file-based samples (with path or url), only metadata is saved.
 * @param allSamples - array of SampleDescriptor (may include recorded or file-based samples)
 * @param bpm - beats per minute to persist alongside samples
 */
export function saveAllSamplesToLocalStorage(
  allSamples: SampleDescriptor[],
  bpm: number
): void {
  const serialized = allSamples
    .map((sample) => {
      // File-based sample: save only metadata
      if (sample.path || sample.url) {
        const { buffer, ...meta } = sample;
        return { ...meta, __fileBased: true };
      }

      // Recorded sample: serialize PCM from AudioBuffer
      const audioBuf = (sample as any).audioBuffer ?? sample.buffer;
      if (!audioBuf || typeof audioBuf.numberOfChannels !== "number") {
        return null;
      }
      const numChannels = audioBuf.numberOfChannels;
      const channelData: number[][] = [];
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
    .filter((item): item is Exclude<typeof item, null> => item !== null);

  localStorage.setItem("LoopiereSequences", JSON.stringify(serialized));
  localStorage.setItem("LoopiereBPM", bpm.toString());
}

/**
 * Rebuild sample buffers from localStorage data.
 * File-based samples are reloaded via getSampleBuffer;
 * recorded samples are reconstructed from saved PCM.
 * @returns Promise resolving to an array of SampleDescriptor with buffers
 */
export async function getAllSamplesFromLocalStorage(
  audioContext: AudioContext
): Promise<SampleDescriptor[]> {
  const serialized = localStorage.getItem("LoopiereSequences");
  if (!serialized) return [];

  const arr: Record<string, any>[] = JSON.parse(serialized);
  const results = await Promise.all(
    arr.map(async (data) => {
      if (data.__fileBased) {
        const { __fileBased, ...meta } = data;
        const buffer = await getSampleBuffer(meta as SampleDescriptor);
        return { ...(meta as SampleDescriptor), buffer };
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
      __pcm.forEach((chanArr: number[], ch: number) => {
        buffer.copyToChannel(new Float32Array(chanArr), ch);
      });
      return { ...(rest as SampleDescriptor), buffer };
    })
  );
  return results;
}
