import React, { useState } from 'react';
import './style/App.css';
import BankButtonList from './components/BankButtonList';
import TrackList from './components/TrackList';
import SampleButton from './components/SampleButton';
import { fetchAudioData } from './utils/fetchAudioData';
import banks from './data/banks.json';

const App = () => {
  const [buttons, setButtons] = useState([]);
  const [sampleSellected, setSampleSellected] = useState(null);

  const spawnButton = (filename) => {
    fetchAudioData(filename)
      .then((data) => {
        if (data) {
          setButtons(data);
          console.log('Audio JSON:', data, buttons);
        }
      })
      .catch((error) => {
        console.error('Error fetching or setting buttons:', error);
      });
  };

  const handleDragStart = (e, sample, audioBuffer) => {
    const targetRect = e.target.getBoundingClientRect();
    const mouseX = e.clientX;
    const xDivMouse = mouseX - targetRect.left;
    sample.xDragOffset = xDivMouse;
    sample.audioBuffer = audioBuffer;
    console.log('---',sample)
    setSampleSellected(sample);
  };
  if(!buttons.length) {
    spawnButton(banks[0].filename)
  }

  return (
    <div className="App">
      <h1>Loopiere</h1>
      <TrackList 
        trackNumber={4} 
        sampleSelected={sampleSellected} 
        handleDragStart={handleDragStart} 
      />
      <BankButtonList banks={banks} spawnButton={spawnButton} />
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
