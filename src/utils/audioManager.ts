// src/utils/audioManager.ts

import { getAudioContext } from "./audioContextSetup";
import { resolveSamplePath } from "./resolveSamplePath";
import type { BaseSample, TrackSample } from "../types/audio";

/**
 * Fetches & decodes an audio file.
 * @param filePath - "/foo.wav" or "samples/bar.wav"
 * @returns decoded AudioBuffer
 */
export async function loadAudio(resolvedPath: string): Promise<AudioBuffer> {
  console.log("Loading audio from", resolvedPath);
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
      `Invalid content-type \"${contentType}\" for ${resolvedPath}`
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
 * @param sample - must have at least `path` or `url`, or an existing `buffer`
 */
export async function getSampleBuffer(
  sample: BaseSample
): Promise<AudioBuffer> {
  if (sample.buffer) return sample.buffer;

  const blobUrl = sample.type === "recording" ? sample.blobUrl : null;

  if (blobUrl) {
    const arrayBuffer = await fetch(blobUrl).then((r) => r.arrayBuffer());
    const audioCtx = getAudioContext();
    sample.buffer = await audioCtx.decodeAudioData(arrayBuffer);
    return sample.buffer;
  }

  const cacheKey =
    sample.type === "remote"
      ? sample.url
      : sample.type === "local"
      ? sample.path
      : null;

  if (cacheKey && bufferCache.has(cacheKey)) {
    sample.buffer = bufferCache.get(cacheKey)!;
    return sample.buffer;
  }

  const rawPath =
    sample.type === "remote"
      ? sample.url
      : sample.type === "local"
      ? sample.path
      : null;

  if (!rawPath) {
    throw new Error("getSampleBuffer: sample missing both url and path");
  }

  const assetPath = resolveSamplePath(rawPath);
  const decoded = await loadAudio(assetPath);
  sample.buffer = decoded;
  return decoded;
}

/**
 * Preload & decode all buffers for a set of samples grouped by track.
 * @param allSamples - flat array of TrackSample (with `trackId`)
 * @param tracks - array of track objects with numeric `id` fields
 */
export async function prepareAllTracks(
  allSamples: TrackSample[],
  tracks: { id?: number }[]
): Promise<void> {
  if (!Array.isArray(allSamples) || !Array.isArray(tracks)) {
    console.warn("[prepareAllTracks] invalid args", allSamples, tracks);
    return;
  }

  const samplesByTrack = allSamples.reduce<Record<number, TrackSample[]>>(
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
