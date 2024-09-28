import React, { useState } from 'react';
import SampleButton from './components/SampleButton';
import Track from './components/Tracks';
import './style/App.css'; // Add your own styles or use inline styles


async function fetchAudioData() {
  const url = 'samples.json';

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

const App = () => {
  const [buttons, setButtons] = useState([]);
  const [sampleSellected, setSampleSellected] = useState(null);

  const spawnButton = () => {
    fetchAudioData().then((data) => {
      if (data) {
        // Assuming data is an array or a mappable object
        setButtons(data); // Set buttons state to the fetched data
        console.log('Audio JSON:', data, buttons);
      }
    }).catch((error) => {
      console.error('Error fetching or setting buttons:', error);
    });
  };

  const generateTracks = (trackNumber) => {
    return Array.from({ length: trackNumber }, (_, index) => ({
      id: index + 1,
      name: `Track ${index}`,
      event: []
    }));
  };

  // 4 tracks TODO; make dynamic
  const trackNumber = 4;
  const tracks = generateTracks(trackNumber);

  // sample that is being dragged
  const handleDragStart = (e, sample) => {
    console.log('start', e.target, sample)
    setSampleSellected(sample);
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      {tracks.map((track, index) => (
        <Track 
          trackInfo={track} 
          sample={sampleSellected} 
          />
      ))}
      <button onClick={spawnButton}>Spawn Button</button>
      <div className="button-container">
        {buttons.map((sample, index) => (
          <SampleButton 
            key={index} 
            id={index} 
            sample={sample} 
            handleDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
