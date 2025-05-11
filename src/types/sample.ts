// src/types/sample.ts

import type { SampleDescriptor } from "../utils/audioManager";

/**
 * Signature for moving a sample to a new fractional position.
 *
 * @param sample   The full sample descriptor being moved.
 * @param xPosFraction  New position as a fraction of track width (0–1).
 */
export type UpdateSamplePositionFn = (
  sample: SampleDescriptor,
  xPosFraction: number
) => void;
