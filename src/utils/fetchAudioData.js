function addToData(bank, data) {
  data.forEach((sampleRecord, index) => {
    // add identifier so that I can track it on the track
    sampleRecord.identifier = `${bank}-${index}` 
  });
  return data;
}

export async function fetchAudioData(bank) {
  const url = bank ? bank : '/samples.json'; // Adjusted path

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('data: ', data); 
    addToData(bank, data)
    return data;
  } catch (error) {
    console.error('Failed to fetch audio data:', error);
    return null;
  }
}
