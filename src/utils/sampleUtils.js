export function createTrackSample(sample, trackId, xPosFraction) {
  return {
    id: `${sample.filename}-${trackId}-${Math.round(Math.random() * 1000)}`,
    filename: sample.filename,
    path: sample.path,
    xPos: xPosFraction,
    trackId,
    onTrack: true,
    audioBuffer: sample.audioBuffer || null,
  };
}
