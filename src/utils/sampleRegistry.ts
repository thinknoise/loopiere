// src/utils/sampleRegistry.ts
import type { SampleDescriptor } from "./audioManager";
import { resolveSamplePath } from "./resolveSamplePath";

const registry = new Map<number, SampleDescriptor>();

export function addSampleToRegistry(sample: SampleDescriptor) {
  if (!sample.url && sample.path && !sample.path.startsWith("blob:")) {
    sample.url = resolveSamplePath(sample.path); // Resolve on entry
  }
  registry.set(sample.id, sample);
}

export function getSampleFromRegistry(
  id: number
): SampleDescriptor | undefined {
  return registry.get(id);
}
