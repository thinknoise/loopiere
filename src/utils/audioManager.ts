// src/utils/audioManager.ts

import { getAudioContext } from "./audioContextSetup";
import { resolveSamplePath } from "./resolveSamplePath";

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
  // Reuse existing decoded buffer if present
  if (sample.buffer) return sample.buffer;

  if (!sample.url) {
    throw new Error("getSampleBuffer: sample is missing a URL");
  }

  // Use blob: URL (recorded sample)
  if (sample.url.startsWith("blob:")) {
    const arrayBuffer = await fetch(sample.url).then((r) => r.arrayBuffer());
    const audioCtx = getAudioContext();
    sample.buffer = await audioCtx.decodeAudioData(arrayBuffer);
    return sample.buffer;
  }

  // Check in-memory cache
  if (bufferCache.has(sample.url)) {
    sample.buffer = bufferCache.get(sample.url)!;
    return sample.buffer;
  }

  // Fetch and decode
  const decoded = await loadAudio(sample.url);
  bufferCache.set(sample.url, decoded);
  sample.buffer = decoded;
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
