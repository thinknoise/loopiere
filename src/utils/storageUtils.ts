// src/utils/storageUtils.ts

import { getAudioContext } from "./audioContextSetup";
import { getSampleBuffer } from "./audioManager";
import type { SampleDescriptor } from "./audioManager";

/**
 * Strip out the live AudioBuffer before serializing,
 * but keep all other SampleDescriptor fields.
 */
type BaseSerializedSample = Omit<SampleDescriptor, "buffer"> & {
  __fileBased: boolean;
};

/**
 * A file‐based sample: just metadata (no PCM data).
 */
type SerializedFileSample = BaseSerializedSample & {
  __fileBased: true;
};

/**
 * A recorded sample: full PCM dump.
 */
type SerializedPCMSample = BaseSerializedSample & {
  __fileBased: false;
  __pcm: number[][];
  __sampleRate: number;
  __length: number;
  __numChannels: number;
};

/**
 * The union of both, which is exactly what you store in localStorage.
 */
type SerializedSample = SerializedFileSample | SerializedPCMSample;

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
    .map<SerializedSample | null>((sample) => {
      const isStatic =
        (!!sample.path && !sample.path.startsWith("blob:")) ||
        (!!sample.url && !sample.url.startsWith("blob:"));

      if (isStatic) {
        // meta only
        const { buffer, ...rest } = sample;
        return { ...rest, __fileBased: true };
      }

      // PCM branch
      const buf = sample.buffer;
      if (!buf) return null;
      const channelData = Array.from(
        { length: buf.numberOfChannels },
        (_, ch) => Array.from(buf.getChannelData(ch))
      );
      return {
        // spread everything *but* buffer
        id: sample.id,
        filename: sample.filename,
        path: sample.path,
        url: sample.url,
        duration: sample.duration,
        trackId: sample.trackId,
        xPos: sample.xPos,
        onTrack: sample.onTrack,
        startTime: sample.startTime,

        __fileBased: false,
        __pcm: channelData,
        __sampleRate: buf.sampleRate,
        __length: buf.length,
        __numChannels: buf.numberOfChannels,
      };
    })
    .filter((s): s is SerializedSample => s !== null);

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
