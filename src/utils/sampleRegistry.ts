// src/utils/sampleRegistry.ts
import type { SampleDescriptor } from "./audioManager";

const registry = new Map<number, SampleDescriptor>();

export function addSampleToRegistry(sample: SampleDescriptor) {
  registry.set(sample.id, sample);
}

export function getSampleFromRegistry(
  id: number
): SampleDescriptor | undefined {
  return registry.get(id);
}
