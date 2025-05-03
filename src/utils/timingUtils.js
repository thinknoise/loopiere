// utils/timingUtils.js

export const BEATS_PER_MEASURE = 4;

// Convert BPM to loop length in seconds
export function bpmToSecondsPerLoop(bpm) {
  return (60 / bpm) * BEATS_PER_MEASURE;
}

// Convert track width + BPM to pixels per second
export function getPixelsPerSecond(trackWidth, bpm) {
  const secs = bpmToSecondsPerLoop(bpm);
  return trackWidth / secs;
}

// Convert time in seconds to pixels
export function timeToPixels(seconds, trackWidth, bpm) {
  return seconds * getPixelsPerSecond(trackWidth, bpm);
}

// Convert pixels to time in seconds
export function pixelsToTime(pixels, trackWidth, bpm) {
  return pixels / getPixelsPerSecond(trackWidth, bpm);
}

// Convert xPos (fraction of width) to time
export function xPosToTime(xPosFraction, trackWidth, bpm) {
  return (xPosFraction * trackWidth) / getPixelsPerSecond(trackWidth, bpm);
}
