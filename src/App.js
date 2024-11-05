import React, { useState } from 'react';
import './style/App.css';
import BankSampleList from './components/BankSamplelist';
import { SequenceProvider } from './contexts/SequenceContext';
import TrackList from './components/TrackList';


const App = () => {
  const [sampleSellected, setSampleSellected] = useState(null);

  const handleDragStart = (e, sample, audioBuffer) => {
    const targetRect = e.target.getBoundingClientRect();
    // console.log(e.clientX, targetRect.left)
    const xDivMouse = e.clientX - targetRect.left;
    sample.xDragOffset = xDivMouse;
    sample.audioBuffer = audioBuffer;
    setSampleSellected(sample);
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      <SequenceProvider>
        <TrackList 
          trackNumber={4} 
          sampleSelected={sampleSellected} 
        />
      </SequenceProvider>
      <BankSampleList handleDragStart={handleDragStart} />
    </div>
  );
};

export default App;
