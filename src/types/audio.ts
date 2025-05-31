// src/types/audio.ts

import type { RefObject } from "react";

/**
 * Describes all the per-track AudioNodes and parameter maps that Track
 * (and our playback hook) expect to see.
 */
export interface TrackAudioState {
  /**
   * A Ref‐wrapped Map whose keys are of the form `${trackId}_gain`, `${trackId}_pan`,
   * `${trackId}_lowpass`, `${trackId}_highpass`, and whose values are the actual AudioNode.
   */
  filters: RefObject<Map<string, AudioNode>>;

  /** Current low-pass cutoff frequency, indexed by track ID */
  frequencies: Record<number, number>;

  /** Current high-pass cutoff frequency, indexed by track ID */
  highpassFrequencies: Record<number, number>;

  /** Current gain (volume) per track, indexed by track ID */
  gains: Record<number, number>;

  /** Current stereo pan per track, indexed by track ID */
  pans: Record<number, number>;
}
