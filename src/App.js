import React, { useState, useEffect } from 'react';
import SampleButton from './components/SampleButton';
import Track from './components/Track';
import './style/App.css';

async function fetchAudioData(filename) {
  const url = filename ? filename : 'samples.json';

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

  useEffect(() => {
    // This will log the updated value whenever samplesDroppedOnTrack changes
    console.log('sample Sellected:', sampleSellected);
  }, [sampleSellected]);

  
  const banks = [
    {
      name: "basic",
      filename: "samples.json",
    },
    {
      name: 'percussion',
      filename: 'sample_percussion.json',
    },
    {
      name: 'loops',
      filename: 'sample_loops_etc.json',
    }
  ]

  const spawnButton = (filename) => {
    fetchAudioData(filename).then((data) => {
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

  const handleDragStart = (e, sample) => {
    setSampleSellected(sample);
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>

      {tracks.map((track, index) => (
        <Track
          key={index}
          trackInfo={track}
          sample={sampleSellected}
          handleDragStart={handleDragStart}
        />
      ))}

      {banks.map((bank, index) => (
        <button 
          key={'bank' + index}
          onClick={() => spawnButton(bank.filename)}
        >
          {bank.name}
        </button>
      ))}

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
