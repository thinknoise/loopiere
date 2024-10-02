export async function fetchAudioData(filename) {
  const url = filename ? filename : '/samples.json'; // Adjusted path

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response Status: ', response.status); // Log status
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
