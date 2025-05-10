// audioManager.js
import { getAudioContext } from "./audioContextSetup";

// Base URL helper, respects PUBLIC_URL (e.g. for subdirectory deployments)
const BASE = process.env.PUBLIC_URL || "";
export function assetUrl(path) {
  // collapse duplicate slashes
  return `${BASE}/${path}`.replace(/\/\/{2,}/g, "/");
}

/**
 * Fetches and decodes an audio file, automatically resolving
 * any leading-absolute or relative paths under PUBLIC_URL.
 * @param {string} filePath - e.g. '/onehits/foo.wav' or 'samples/bar.wav'
 * @returns {Promise<AudioBuffer>}
 */
export const loadAudio = async (filePath) => {
  let resolvedPath = filePath;
  // If absolute path, strip leading slash and prefix
  if (resolvedPath.startsWith("/")) {
    resolvedPath = assetUrl(resolvedPath.replace(/^\/+/, ""));
  }
  // If relative (no http:// or blob:), prefix too
  else if (
    !/^[a-z]+:\/\//i.test(resolvedPath) &&
    !resolvedPath.startsWith("blob:")
  ) {
    resolvedPath = assetUrl(resolvedPath);
  }

  try {
    const response = await fetch(resolvedPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("audio/")) {
      throw new Error(`Invalid content-type: ${contentType}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const raw = getAudioContext();
    return await raw.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error loading audio:", error, "from", resolvedPath);
    throw error;
  }
};

// In-memory cache for decoded buffers
const bufferCache = new Map();

/**
 * Loads (and decodes) a sample once.
 * Supports both sample.url (explicit path) and sample.path (filename under samples/).
 * Handles blob URLs in either url or path to avoid invalid content-type errors.
 * @param {{ path?: string, url?: string, buffer?: AudioBuffer }} sample
 * @returns {Promise<AudioBuffer>}
 */
export async function getSampleBuffer(sample) {
  // Return existing buffer if present
  if (sample.buffer) return sample.buffer;

  // Determine if this is a blob URL in url or path
  const blobUrl = sample.url?.startsWith("blob:")
    ? sample.url
    : sample.path?.startsWith("blob:")
    ? sample.path
    : null;
  if (blobUrl) {
    try {
      const arrayBuffer = await fetch(blobUrl).then((r) => r.arrayBuffer());
      const audioCtx = getAudioContext();
      sample.buffer = await audioCtx.decodeAudioData(arrayBuffer);
      return sample.buffer;
    } catch (error) {
      console.error("Error decoding blob URL audio:", error);
      throw error;
    }
  }

  // Cache lookup key
  let cacheKey = sample.path || sample.url;
  if (cacheKey && bufferCache.has(cacheKey)) {
    sample.buffer = bufferCache.get(cacheKey);
    return sample.buffer;
  }

  // Determine asset path for non-blob URLs
  let rawPath;
  if (sample.url) {
    rawPath = sample.url.replace(/^\/+/, "");
  } else if (sample.path) {
    rawPath = `samples/${sample.path}`;
  } else {
    throw new Error("getSampleBuffer: sample missing both url and path");
  }

  // Fetch & decode via loadAudio (handles prefixing)
  const buffer = await loadAudio(rawPath);
  sample.buffer = buffer;
  if (cacheKey) bufferCache.set(cacheKey, buffer);
  return buffer;
}

/**
 * Load and decode all sample buffers for the given tracks.
 * Delegates to getSampleBuffer for correct path resolution and caching.
 */
export const prepareAllTracks = async (allSamples = [], tracks = []) => {
  if (!Array.isArray(allSamples) || !Array.isArray(tracks)) {
    console.warn("[prepareAllTracks] invalid parameters", allSamples, tracks);
    return;
  }

  const samplesByTrack = allSamples.reduce((acc, sample) => {
    const id = sample && sample.trackId;
    if (id == null) return acc;
    acc[id] = acc[id] || [];
    acc[id].push(sample);
    return acc;
  }, {});

  for (const track of tracks) {
    if (!track || track.id == null) continue;
    const samples = samplesByTrack[track.id] || [];
    for (const sample of samples) {
      if (!sample) continue;
      try {
        await getSampleBuffer(sample);
      } catch (err) {
        console.error("[prepareAllTracks] failed to load sample:", sample, err);
      }
    }
  }
};
