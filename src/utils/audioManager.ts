// src/utils/audioManager.ts

import { getAudioContext } from "./audioContextSetup";

/**
 * Build a fully-qualified URL for assets, respecting PUBLIC_URL.
 * @param path - e.g. "samples/foo.wav" or "/onehits/bar.wav"
 * @returns collapsed URL string
 */
export function assetUrl(path: string): string {
  const BASE = process.env.PUBLIC_URL || "";
  return `${BASE}/${path}`.replace(/\/\/{2,}/g, "/");
}

/**
 * Fetches & decodes an audio file.
 * @param filePath - "/foo.wav" or "samples/bar.wav"
 * @returns decoded AudioBuffer
 */
export async function loadAudio(filePath: string): Promise<AudioBuffer> {
  let resolvedPath = filePath;

  // strip leading slash & prefix PUBLIC_URL
  if (resolvedPath.startsWith("/")) {
    resolvedPath = assetUrl(resolvedPath.replace(/^\/+/, ""));
  }
  // relative path (no protocol or blob:)
  else if (
    !/^[a-z]+:\/\//i.test(resolvedPath) &&
    !resolvedPath.startsWith("blob:")
  ) {
    resolvedPath = assetUrl(resolvedPath);
  }

  const resp = await fetch(resolvedPath);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching audio from ${resolvedPath}`);
  }
  const contentType = resp.headers.get("content-type");
  if (!contentType || !contentType.startsWith("audio/")) {
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
 * A sample descriptor for loading.
 */
export interface SampleDescriptor {
  id: number;
  filename: string;
  path?: string | null;
  url?: string | null;
  buffer?: AudioBuffer | null;
  duration?: number;

  // Placed‐on‐track metadata:
  trackId?: number;
  xPos?: number;
  onTrack?: boolean;
  startTime?: number;
}

/**
 * Decode & cache a sample’s AudioBuffer.
 * @param sample - must have at least `path` or `url`, or an existing `buffer`
 */
export async function getSampleBuffer(
  sample: SampleDescriptor
): Promise<AudioBuffer> {
  // return existing buffer
  if (sample.buffer) return sample.buffer;

  // handle blob URLs
  const blobUrl = sample.url?.startsWith("blob:")
    ? sample.url
    : sample.path?.startsWith("blob:")
    ? sample.path
    : null;

  if (blobUrl) {
    const arrayBuffer = await fetch(blobUrl).then((r) => r.arrayBuffer());
    const audioCtx = getAudioContext();
    sample.buffer = await audioCtx.decodeAudioData(arrayBuffer);
    return sample.buffer;
  }

  // compute cache key & check
  const cacheKey = sample.path || sample.url;
  if (cacheKey && bufferCache.has(cacheKey)) {
    sample.buffer = bufferCache.get(cacheKey)!;
    return sample.buffer;
  }

  // build asset-relative path
  let assetPath: string;
  if (sample.url) {
    assetPath = sample.url.replace(/^\/+/, "");
  } else if (sample.path) {
    // strip leading slashes so loadAudio can find it
    const relative = sample.path.replace(/^\/+/, "");
    assetPath = `samples/${relative}`;
  } else {
    throw new Error("getSampleBuffer: sample missing both url and path");
  }
  const decoded = await loadAudio(assetPath);
  sample.buffer = decoded;
  if (cacheKey) bufferCache.set(cacheKey, decoded);
  return decoded;
}

/**
 * Preload & decode all buffers for a set of samples grouped by track.
 * @param allSamples - flat array of SampleDescriptor (with `trackId`)
 * @param tracks - array of track objects with numeric `id` fields
 */
export async function prepareAllTracks(
  allSamples: SampleDescriptor[],
  tracks: { id?: number }[]
): Promise<void> {
  if (!Array.isArray(allSamples) || !Array.isArray(tracks)) {
    console.warn("[prepareAllTracks] invalid args", allSamples, tracks);
    return;
  }

  // group samples by trackId
  const samplesByTrack = allSamples.reduce<Record<number, SampleDescriptor[]>>(
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
