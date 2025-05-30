// src/utils/timingUtils.ts

/**
 * Number of beats in one measure (e.g., 4/4 time).
 */
export const BEATS_PER_MEASURE: number = 4;

/**
 * Convert BPM and beatsPerLoop to total loop length in seconds.
 *
 * @param bpm - Beats per minute.
 * @param beatsPerLoop - Number of beats per loop (e.g. 4 to 16).
 * @returns Loop length in seconds.
 */
export function bpmToSecondsPerLoop(bpm: number, beatsPerLoop: number): number {
  return (60 / bpm) * beatsPerLoop;
}

/**
 * Calculate how many pixels correspond to one second of audio.
 *
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @returns Pixels per second.
 */
export function getPixelsPerSecond(
  trackWidth: number,
  bpm: number,
  beatsPerLoop: number
): number {
  const secs = bpmToSecondsPerLoop(bpm, beatsPerLoop);
  return trackWidth / secs;
}

/**
 * Convert a time duration (in seconds) to a pixel length.
 *
 * @param seconds - Time in seconds.
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @returns Length in pixels.
 */
export function timeToPixels(
  seconds: number,
  trackWidth: number,
  bpm: number,
  beatsPerLoop: number
): number {
  return seconds * getPixelsPerSecond(trackWidth, bpm, beatsPerLoop);
}

/**
 * Convert a fractional x-position (0–1) of the track to time in seconds.
 *
 * @param xPosFraction - Fractional position across the track (0 = start, 1 = end).
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @returns Time in seconds.
 */
export function xPosToTime(
  xPosFraction: number,
  trackWidth: number,
  bpm: number,
  beatsPerLoop: number
): number {
  return (
    (xPosFraction * trackWidth) /
    getPixelsPerSecond(trackWidth, bpm, beatsPerLoop)
  );
}
