// src/utils/audioManager.ts

import { getAudioContext } from "./audioContextSetup";
import { resolveSamplePath } from "./resolveSamplePath";
import type { BaseSample, TrackSampleType } from "../types/audio";

/**
 * Fetches & decodes an audio file.
 * @param filePath - "/foo.wav" or "samples/bar.wav"
 * @returns decoded AudioBuffer
 */
export async function loadAudio(resolvedPath: string): Promise<AudioBuffer> {
  // console.log("Loading audio from", resolvedPath);
  const resp = await fetch(resolvedPath);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching audio from ${resolvedPath}`);
  }

  const contentType = resp.headers.get("content-type") ?? "";
  const isAcceptable =
    contentType.startsWith("audio/") ||
    contentType === "application/octet-stream" ||
    contentType === "binary/octet-stream";

  if (!isAcceptable) {
    throw new Error(
      `Invalid content-type "${contentType}" for ${resolvedPath}`
    );
  }

  const arrayBuffer = await resp.arrayBuffer();
  const audioCtx = getAudioContext();
  return audioCtx.decodeAudioData(arrayBuffer);
}

// In-memory cache of decoded buffers
const bufferCache: Map<string, AudioBuffer> = new Map();

/**
 * Decode & cache a sample’s AudioBuffer.
 * @param sample - must have `path`, or an existing `buffer`
 */
export async function getSampleBuffer(
  sample: BaseSample
): Promise<AudioBuffer | null> {
  if (sample.buffer) return sample.buffer;

  const blobUrl = sample.type === "recording" ? sample.blobUrl : null;

  console.log("getSampleBuffer", sample, blobUrl);

  if (blobUrl) {
    try {
      const arrayBuffer = await fetch(blobUrl).then((r) => r.arrayBuffer());
      console.log("Decoding blobUrl", blobUrl, "size:", arrayBuffer.byteLength);
      const audioCtx = getAudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      sample.buffer = decoded;
      return decoded;
    } catch (err) {
      console.error("❌ Failed to decode blobUrl:", blobUrl, err);
      return null;
    }
  }

  const cacheKey = sample.type === "aws" ? sample.path : null;

  if (cacheKey && bufferCache.has(cacheKey)) {
    sample.buffer = bufferCache.get(cacheKey)!;
    return sample.buffer;
  }
  const rawPath = sample.type === "aws" ? sample.path : null;

  if (!rawPath) {
    console.error("❌ getSampleBuffer: sample missing path", sample);
    return null;
  }

  try {
    const assetPath = resolveSamplePath(rawPath);
    const decoded = await loadAudio(assetPath);
    sample.buffer = decoded;
    return decoded;
  } catch (err) {
    console.error("❌ Failed to load or decode sample at path:", rawPath, err);
    return null;
  }
}

/**
 * Preload & decode all buffers for a set of samples grouped by track.
 * @param allSamples - flat array of TrackSample (with `trackId`)
 * @param tracks - array of track objects with numeric `id` fields
 */
export async function prepareAllTracks(
  allSamples: TrackSampleType[],
  tracks: { id?: number }[]
): Promise<void> {
  if (!Array.isArray(allSamples) || !Array.isArray(tracks)) {
    console.warn("[prepareAllTracks] invalid args", allSamples, tracks);
    return;
  }

  const samplesByTrack = allSamples.reduce<Record<number, TrackSampleType[]>>(
    (acc, s) => {
      const tid = s.trackId;
      if (tid == null) return acc;
      (acc[tid] ??= []).push(s);
      return acc;
    },
    {}
  );

  for (const track of tracks) {
    const tid = track.id;
    if (tid == null) continue;
    const list = samplesByTrack[tid] || [];
    for (const sample of list) {
      try {
        await getSampleBuffer(sample);
      } catch (err) {
        console.error("[prepareAllTracks] failed for sample", sample, err);
      }
    }
  }
}
