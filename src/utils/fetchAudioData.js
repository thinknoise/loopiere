
export async function fetchAudioData(bank) {
  const url = bank ? `/${bank}` : '/samples.json'; // Adjusted path

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
    return data;
  } catch (error) {
    console.error('Failed to fetch audio data:', error);
    return null;
  }
}
