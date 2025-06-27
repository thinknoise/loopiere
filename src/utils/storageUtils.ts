// src/utils/storageUtils.ts

import type { TrackSampleType } from "../types/audio";
import { getSampleBuffer } from "./audioManager";

/**
 * Strip out the live AudioBuffer before serializing,
 * but keep all other TrackSample fields.
 */
type BaseSerializedSample = Omit<TrackSampleType, "buffer"> & {
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
 * For file-based samples (with path), only metadata is saved.
 * @param allSamples - array of TrackSample (may include recorded or file-based samples)
 * @param bpm - beats per minute to persist alongside samples
 * @param trackNumber
 */
export function saveAllSamplesToLocalStorage(
  allSamples: TrackSampleType[],
  bpm: number,
  beatsPerLoop: number,
  trackNumber: number
): void {
  const serializedSamples = allSamples
    .map<SerializedSample | null>((sample) => {
      const isStatic =
        "path" in sample &&
        typeof sample.path === "string" &&
        !sample.path.startsWith("blob:");
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
        id: sample.id,
        filename: sample.filename,
        title: sample.title,
        type: sample.type,
        duration: sample.duration,
        trimStart: sample.trimStart,
        trimEnd: sample.trimEnd,
        trackId: sample.trackId,
        xPos: sample.xPos,
        onTrack: sample.onTrack,
        startTime: sample.startTime,
        ...(sample.type === "recording"
          ? {
              blobUrl: sample.blobUrl,
              blob: sample.blob,
              recordedAt: sample.recordedAt,
            }
          : {}),

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
    trackNumber,
  };

  console.log("Saving 'LoopiereSavedLoopV2':", loopData);
  localStorage.setItem("LoopiereSavedLoopV2", JSON.stringify(loopData));
}

/**
 * Rebuild sample buffers from localStorage data.
 * File-based samples are reloaded via getSampleBuffer;
 * recorded samples are reconstructed from saved PCM.
 * @returns Promise resolving to an array of TrackSample with buffers
 */
export async function getAllSamplesFromLocalStorage(
  audioContext: AudioContext
): Promise<{
  bpm: number;
  beatsPerLoop: number;
  samples: TrackSampleType[];
  trackNumber: number;
}> {
  const raw = localStorage.getItem("LoopiereSavedLoopV2");
  if (!raw) {
    return {
      bpm: 120,
      beatsPerLoop: 4,
      samples: [],
      trackNumber: 4,
    };
  }

  const loopData = JSON.parse(raw);
  console.log("Loading:", loopData);
  const { bpm, beatsPerLoop, serializedSamples, trackNumber } = loopData;

  const samples = await Promise.all(
    serializedSamples.map(async (data: Record<string, any>) => {
      if (data.__fileBased) {
        const { __fileBased, ...meta } = data;
        const buffer = await getSampleBuffer(meta as TrackSampleType);
        return { ...(meta as TrackSampleType), buffer };
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

      return { ...(rest as TrackSampleType), buffer };
    })
  );

  return {
    bpm,
    beatsPerLoop,
    samples,
    trackNumber,
  };
}
