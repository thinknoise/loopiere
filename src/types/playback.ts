// src/types/playback.ts

import type { SampleDescriptor } from "../utils/audioManager";

/**
 * A “placed” sample always has xPos: number.
 */
export interface PlaybackSample extends SampleDescriptor {
  xPos: number;
}
