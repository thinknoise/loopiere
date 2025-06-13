// src/utils/sampleRegistry.ts
import type { BaseSample, RecordingSample } from "../types/audio";
import { getSampleBuffer } from "../utils/audioManager";

// Unified registry (can contain any BaseSample)
const registry = new Map<number, BaseSample>();

// Persisted samples stored in AWS (only RecordingSamples)
const awsRegistry = new Map<number, RecordingSample>();

/**
 * Add any sample to the main registry (local, remote, or recording).
 */
export function addSampleToRegistry(sample: BaseSample) {
  registry.set(sample.id, sample);
  console.log("Adding sample to registry:", Array.from(registry.values()));
}

/**
 * Retrieve any sample from the main registry.
 */
export function getSampleFromRegistry(id: number): BaseSample | undefined {
  return registry.get(id);
}

/**
 * Add a sample that has been uploaded to AWS S3.
 * Ensures it is hydrated with a decoded buffer.
 */
export async function addSampleToAwsRegistry(sample: RecordingSample) {
  const buffer = await getSampleBuffer(sample);
  if (!buffer) {
    console.warn("⚠️ Skipping broken S3 sample:", sample.s3Url);
    return;
  }

  sample.buffer = buffer;
  awsRegistry.set(sample.id, sample);
  addSampleToRegistry(sample);
}

/**
 * Retrieve all uploaded (AWS) samples.
 */
export function getAllAwsSamples(): RecordingSample[] {
  return Array.from(awsRegistry.values());
}
