// saves the loop sequence and the bpm in the url 
// a hack for sharable sequences (there will be a limit with the 256? char url length)



export const addParamsToUrl = (sequence, tempo) => {
  const currentUrl = new URL(`${window.location.origin}${window.location.pathname}`);

  sequence.forEach((sample, index) => {
    const sampleAndPosition = [sample.trackSampleId, Math.round(sample.xPos * 100) / 100].join(',');
    currentUrl.searchParams.set(`s-${index}`, sampleAndPosition);
  });

  window.history.pushState({}, '', currentUrl);
};

export const getParamsAsArray = () => {
  const params = new URLSearchParams(window.location.search);
  const paramArray = [];

  for (const [key, value] of params.entries()) {
    paramArray.push({ key, value });
  }

  return paramArray;
};
