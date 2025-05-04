// audioManager.js
let audioContext = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const loadAudio = async (filePath) => {
  const context = getAudioContext();
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("audio/")) {
      throw new Error(`Invalid content-type: ${contentType}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error("Error loading audio:", error);
    throw error;
  }
};

/**
 * Load and decode all sample buffers for the given tracks.
 * @param {Array} allSamples - list of sample objects with trackId, url, path, buffer fields
 * @param {Array} tracks - list of track objects with id field
 */
export const prepareAllTracks = async (allSamples = [], tracks = []) => {
  if (!Array.isArray(allSamples) || !Array.isArray(tracks)) {
    console.warn("[prepareAllTracks] invalid parameters", allSamples, tracks);
    return;
  }

  const samplesByTrack = allSamples.reduce((acc, sample) => {
    const id = sample && sample.trackId;
    if (id == null) return acc;
    acc[id] = acc[id] || [];
    acc[id].push(sample);
    return acc;
  }, {});

  for (const track of tracks) {
    if (!track || track.id == null) continue;
    const samples = samplesByTrack[track.id] || [];
    for (const sample of samples) {
      if (!sample || sample.buffer) continue;
      const url =
        sample.url || (sample.path ? `/samples/${sample.path}` : null);
      if (!url) {
        console.warn(
          "[prepareAllTracks] skipping sample with no URL or buffer",
          sample
        );
        continue;
      }
      try {
        const buffer = await loadAudio(url);
        sample.buffer = buffer;
        sample.url = url;
      } catch (err) {
        console.error("[prepareAllTracks] failed to load sample:", url, err);
      }
    }
  }
};
