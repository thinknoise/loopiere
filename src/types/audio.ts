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
 * A sample stored in AWS S3.
 * Contains metadata about the S3 path and optional key.
 * Used for samples uploaded to the cloud.
 * The `path` is the S3 URL or relative path to the sample.
 * The `s3Key` is the S3 object key if different from the path.
 * This is used to reference samples stored in S3.
 */
export type AwsSampleType = SampleCore & {
  type: "aws";
  path: string;
  s3Key?: string;
};

/**
 * A recorded sample: full PCM dump.
 * Contains metadata about the recording, including the blob URL.
 * The `blob` is the raw audio data, and `blobUrl` is a URL to access it.
 * The `recordedAt` field indicates when the recording was made.
 * The `s3Key` and `s3Url` are optional fields for cloud storage.
 * The `name` field is an optional human-readable name for the recording.
 * This type is used for samples created through the recording feature.
 */
export type RecordingSample = SampleCore & {
  type: "recording";
  blob: Blob;
  blobUrl: string;
  recordedAt: Date;
  s3Key?: string;
  s3Url?: string;
  name?: string;
};

/**
 * Union of all sample source types.
 * Represents an audio source regardless of where it came from.
 */
export type BaseSample = RecordingSample | AwsSampleType;

/**
 * A sample placed on a track at a specific time/location.
 * Adds timeline and positioning metadata to a source sample.
 */
export type TrackSampleType = BaseSample & {
  trackId: number;
  xPos: number;
  onTrack: boolean;
  startTime?: number;

  effects?: {
    volume?: number;
    pan?: number;
    highpassFreq?: number;
    lowpassFreq?: number;
    bypassHighpass?: boolean;
    bypassLowpass?: boolean;
  };
};
