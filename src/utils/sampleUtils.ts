// src/utils/sampleUtils.ts

import { type SampleDescriptor } from "./audioManager";
/**
 * Create a new SampleDescriptor for placement on a track.
 * @param sample - original sample descriptor
 * @param trackId - numeric ID of the track
 * @param xPosFraction - fractional position across the track (0–1)
 * @returns a new SampleDescriptor with unique ID, track placement, and buffer
 */
export function createTrackSample(
  sample: SampleDescriptor,
  trackId: number,
  xPosFraction: number
): SampleDescriptor {
  return {
    ...sample, // carry over buffer, url, path, filename, etc.
    id: Date.now() + Math.floor(Math.random() * 1000), // new unique ID
    trackId, // the target track
    xPos: xPosFraction, // fractional start
    onTrack: true, // optional flag
  };
}
