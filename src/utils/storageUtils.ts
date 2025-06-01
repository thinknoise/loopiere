// src/utils/storageUtils.ts

import { getSampleBuffer } from "./audioManager";
import type { SampleDescriptor } from "./audioManager";
import { resolveSamplePath } from "./resolveSamplePath";

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
  bpm: number,
  beatsPerLoop: number
): void {
  const serializedSamples = allSamples
    .map<SerializedSample | null>((sample) => {
      const isStatic =
        (!!sample.path && !sample.path.startsWith("blob:")) ||
        (!!sample.url && !sample.url.startsWith("blob:"));

      // Always ensure .url is present for static samples
      if (isStatic) {
        const { buffer, ...rest } = sample;
        const url =
          sample.url ??
          (sample.path && !sample.path.startsWith("blob:")
            ? resolveSamplePath(sample.path)
            : undefined);

        return { ...rest, url, __fileBased: true };
      } // PCM branch
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

  const loopData = {
    bpm,
    beatsPerLoop,
    serializedSamples,
  };

  console.log("Saving:", loopData);
  localStorage.setItem("LoopiereSavedLoopV2", JSON.stringify(loopData));
}

/**
 * Rebuild sample buffers from localStorage data.
 * File-based samples are reloaded via getSampleBuffer;
 * recorded samples are reconstructed from saved PCM.
 * @returns Promise resolving to an array of SampleDescriptor with buffers
 */
export async function getAllSamplesFromLocalStorage(
  audioContext: AudioContext
): Promise<{
  bpm: number;
  beatsPerLoop: number;
  samples: SampleDescriptor[];
}> {
  const raw = localStorage.getItem("LoopiereSavedLoopV2");
  if (!raw) {
    return {
      bpm: 120,
      beatsPerLoop: 4,
      samples: [],
    };
  }

  const loopData = JSON.parse(raw);
  console.log("Loading:", loopData);
  const { bpm, beatsPerLoop, serializedSamples } = loopData;

  const samples = await Promise.all(
    serializedSamples.map(async (data: Record<string, any>) => {
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

      const buffer = audioContext.createBuffer(
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

  return {
    bpm,
    beatsPerLoop,
    samples,
  };
}
