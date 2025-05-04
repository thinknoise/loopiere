/**
 * Converts an audio duration into pixel width for the track or bank preview.
 *
 * @param {number} duration - Duration of the sample in seconds
 * @param {number} trackWidth - Full width of the track view in pixels (e.g. 1200)
 * @param {number} bpm - Beats per minute
 * @param {number} beatsPerMeasure - Default 4
 * @returns {number} Width in pixels
 */
export function getSamplePixelWidth(
  duration,
  trackWidth,
  bpm,
  beatsPerMeasure = 4
) {
  const secsPerMeasure = (60 / bpm) * beatsPerMeasure;
  return duration ? (duration / secsPerMeasure) * trackWidth : 0;
}
