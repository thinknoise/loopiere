// src/types/audio.ts

/**
 * Shared core fields across all samples.
 */
export interface SampleCore {
  id: number;
  title: string;
  filename: string;
  buffer?: AudioBuffer | null;
  duration?: number;

  /** Optional trim points (in seconds) */
  trimStart?: number;
  trimEnd?: number;
}

/**
 * A sample sourced from the local project files.
 * Example: "samples/kick.wav"
 */
export type LocalSample = SampleCore & {
  type: "local";
  path: string;
};

/**
 * A sample recorded in-browser by the user.
 * Uses a blob URL for preview and stores the blob itself.
 */
export type RecordingSample = SampleCore & {
  type: "recording";
  blob: Blob;
  blobUrl: string;
  recordedAt: Date;
};

/**
 * A sample hosted remotely, such as from an S3 bucket.
 */
export type RemoteSample = SampleCore & {
  type: "remote";
  url: string;
};

/**
 * Union of all sample source types.
 * Represents an audio source regardless of where it came from.
 */
export type BaseSample = LocalSample | RecordingSample | RemoteSample;

/**
 * A sample placed on a track at a specific time/location.
 * Adds timeline and positioning metadata to a source sample.
 */
export type TrackSample = BaseSample & {
  trackId: number;
  xPos: number;
  onTrack: boolean;
  startTime?: number;
};
