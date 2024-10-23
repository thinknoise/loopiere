// saves the loop sequence and the bpm in local storage 
// a hack for personal storage, not sharable

export const saveAllSamplesToLocalStorage = (allSamples, bpm) => {
  const serializedSamples = JSON.stringify(allSamples);
  localStorage.setItem('LoopiereSequences', serializedSamples);
  localStorage.setItem('LoopiereBPM', bpm);
};

export const getAllSamplesFromLocalStorage = () => {
  const serializedSamples = localStorage.getItem('LoopiereSequences');
  return serializedSamples ? JSON.parse(serializedSamples) : [];
};
