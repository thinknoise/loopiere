// src/utils/sampleRegistry.ts
import type { BaseSample } from "../types/audio";

const registry = new Map<number, BaseSample>();

export function addSampleToRegistry(sample: BaseSample) {
  registry.set(sample.id, sample);
}

export function getSampleFromRegistry(id: number): BaseSample | undefined {
  return registry.get(id);
}
