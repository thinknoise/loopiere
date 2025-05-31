// src/utils/timeHelpers.ts

/*───────────────────────────────────────────────────────────────────────────*\
|  1) BPM‐↔‐Time Conversions                                                |
\*───────────────────────────────────────────────────────────────────────────*/

/**
 * Convert a beat index into seconds, given a tempo (bpm).
 *   seconds = (beat / bpm) * 60
 */
export function beatToSeconds(beat: number, bpm: number): number {
  return (beat / bpm) * 60;
}

/**
 * Convert seconds into beat index, given a tempo (bpm).
 *   beat = (seconds / 60) * bpm
 */
export function secondsToBeat(seconds: number, bpm: number): number {
  return (seconds / 60) * bpm;
}

/**
 * Convert BPM and beatsPerLoop to total loop length in seconds.
 *
 * @param bpm - Beats per minute.
 * @param beatsPerLoop - Number of beats per loop (e.g. 4 to 16).
 * @returns Loop length in seconds.
 */
export function bpmToSecondsPerLoop(bpm: number, beatsPerLoop: number): number {
  // (60 / bpm) * beatsPerLoop
  return (60 / bpm) * beatsPerLoop;
}

/*───────────────────────────────────────────────────────────────────────────*\
|  2) Pixel‐↔‐Time Conversions                                               |
\*───────────────────────────────────────────────────────────────────────────*/

/**
 * Calculate how many pixels correspond to one second of audio.
 *
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @param beatsPerLoop - Number of beats per loop.
 * @returns Pixels per second.
 */
export function getPixelsPerSecond(
  trackWidth: number,
  bpm: number,
  beatsPerLoop: number
): number {
  const secsPerLoop = bpmToSecondsPerLoop(bpm, beatsPerLoop);
  return trackWidth / secsPerLoop;
}

/**
 * Convert a time duration (in seconds) to a pixel length.
 *
 * @param seconds - Time in seconds.
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @param beatsPerLoop - Number of beats per loop.
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
 * Convert a fractional x‐position (0–1) of the track to time in seconds.
 *
 * @param xPosFraction - Fractional position across the track (0 = start, 1 = end).
 * @param trackWidth - Width of the track (in pixels).
 * @param bpm - Beats per minute.
 * @param beatsPerLoop - Number of beats per loop.
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

/*───────────────────────────────────────────────────────────────────────────*\
|  3) Beat‐↔‐Pixel Conversions                                                |
\*───────────────────────────────────────────────────────────────────────────*/

/**
 * Convert a beat index into a pixel offset, given:
 *   - containerWidthPx: total width for the full loop (in px)
 *   - beatsPerLoop: how many beats fit across that full width
 *
 *   pixels = (beat / beatsPerLoop) * containerWidthPx
 */
export function beatToPixels(
  beat: number,
  containerWidthPx: number,
  beatsPerLoop: number
): number {
  return (beat / beatsPerLoop) * containerWidthPx;
}

/**
 * Convert a pixel offset into a beat index, given:
 *   - containerWidthPx: total width for the full loop (in px)
 *   - beatsPerLoop: how many beats fit across that full width
 *
 *   beat = (px / containerWidthPx) * beatsPerLoop
 */
export function pixelsToBeat(
  px: number,
  containerWidthPx: number,
  beatsPerLoop: number
): number {
  return (px / containerWidthPx) * beatsPerLoop;
}
