// src/utils/sampleRegistry.ts

import type { BaseSample, RecordingSample } from "../types/audio";

// Unified registry for all samples
// This can include local samples, remote samples, and recording samples.
// It allows for easy access and management of samples across the application.
// The key is the sample ID, and the value is the sample object.
// This registry can be used to store samples that are uploaded to AWS S3,
// recorded locally, or fetched from any other source.
// It is designed to be flexible and extensible for future sample types.
const registry = new Map<number, BaseSample>();

/**
 * Add any sample to the registry (local, remote, or recording).
 */
export function addSampleToRegistry(sample: BaseSample) {
  registry.set(sample.id, sample);
  // console.log("Adding sample to registry:", Array.from(registry.values()));
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
 * may want to be more AWS specific in the future to filter by type or other criteria.
 */
export function getAwsSamplesFromRegistry(): RecordingSample[] {
  return Array.from(registry.values()).filter(
    (s): s is RecordingSample => s.type === "recording" && !!s.buffer
  );
}
