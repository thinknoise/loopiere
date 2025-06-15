// src/utils/sampleRegistry.ts

import type { BaseSample, RecordingSample } from "../types/audio";
import { getSampleBuffer } from "../utils/audioManager";

// Unified registry for all samples
const registry = new Map<number, BaseSample>();

/**
 * Add any sample to the registry (local, remote, or recording).
 */
export function addSampleToRegistry(sample: BaseSample) {
  registry.set(sample.id, sample);
  console.log("Adding sample to registry:", Array.from(registry.values()));
}

/**
 * Retrieve any sample from the registry.
 */
export function getSampleFromRegistry(id: number): BaseSample | undefined {
  return registry.get(id);
}

/**
 * Retrieve all samples in the registry.
 */
export function getAllSamples(): BaseSample[] {
  return Array.from(registry.values());
}

/**
 * Retrieve only RecordingSamples that have been uploaded and hydrated with a buffer.
 */
export function getAwsSamplesFromRegistry(): RecordingSample[] {
  return Array.from(registry.values()).filter(
    (s): s is RecordingSample => s.type === "recording" && !!s.buffer
  );
}

/**
 * Add a sample that has been uploaded to AWS S3.
 * Ensures it is hydrated with a decoded buffer.
 */
export async function hydrateAndRegisterRecordingSample(
  sample: RecordingSample,
  bufferOverride?: AudioBuffer
) {
  const buffer = bufferOverride ?? (await getSampleBuffer(sample));
  if (!buffer) {
    console.warn("⚠️ Skipping broken S3 sample:", sample.s3Url);
    return;
  }

  sample.buffer = buffer;
  addSampleToRegistry(sample);
}
