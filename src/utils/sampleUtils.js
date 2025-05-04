export function createTrackSample(sample, trackId, xPosFraction) {
  return {
    id: crypto.randomUUID(), // ✅ Unique ID per track instance
    filename: sample.filename,
    path: sample.path,
    xPos: xPosFraction,
    trackId,
    onTrack: true,
    audioBuffer: sample.audioBuffer || sample.buffer || null,
  };
}
