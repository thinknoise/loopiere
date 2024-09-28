import React, { useState } from 'react';
import SampleButton from './components/SampleButton';
import Track from './components/Track';
import './style/App.css';

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
      name: `Track ${index + 1}`,
      event: []
    }));
  };

  const trackNumber = 4;
  const tracks = generateTracks(trackNumber);

  // Handle when a sample is dragged
  const handleDragStart = (e, sample) => {
    setSampleSellected(sample); // Set the selected sample
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      
      {/* Render Tracks */}
      {tracks.map((track, index) => (
        <Track 
          key={index}
          trackInfo={track} 
          sample={sampleSellected}  // Pass the selected sample to each track
        />
      ))}
      
      <button onClick={spawnButton}>Spawn Button</button>
      
      {/* Render Sample Buttons */}
      <div className="button-container">
        {buttons.map((sample, index) => (
          <SampleButton 
            key={index} 
            id={index} 
            sample={sample} 
            handleDragStart={handleDragStart}  // Pass sample and drag handler
          />
        ))}
      </div>
    </div>
  );
};

export default App;
