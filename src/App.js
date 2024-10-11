import React, { useState, useEffect } from 'react';
import './style/App.css';
import BankButtonList from './components/BankButtonList';
import TrackList from './components/TrackList';

const App = () => {
  const [sampleSellected, setSampleSellected] = useState(null);

  const handleDragStart = (e, sample, audioBuffer) => {
    const targetRect = e.target.getBoundingClientRect();
    console.log(e.clientX, targetRect.left)
    const xDivMouse = e.clientX - targetRect.left;
    sample.xDragOffset = xDivMouse;
    sample.audioBuffer = audioBuffer;
    setSampleSellected(sample);
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      <TrackList 
        trackNumber={4} 
        sampleSelected={sampleSellected} 
      />
      <BankButtonList handleDragStart={handleDragStart} />
    </div>
  );
};

export default App;
