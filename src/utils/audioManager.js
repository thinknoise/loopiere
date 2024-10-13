// audioManager.js
let audioContext = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const loadAudio = async (filePath) => {
  const context = getAudioContext(); // Use the initialized context
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
      console.error('Error loading audio:', error);
    throw error;
  }
};
