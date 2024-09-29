import React, { useState, useRef, useEffect } from 'react';
import SampleButton from './components/SampleButton';
import Track from './components/Track';
import './style/App.css';
// Import the banks data from the JSON file
import banks from './data/banks.json'; // Adjust path according to your directory structure

// Import fetchAudioData from the new file
import { fetchAudioData } from './utils/fetchAudioData'; // Adjust the path if necessary

const App = () => {
  const [buttons, setButtons] = useState([]);
  const [sampleSellected, setSampleSellected] = useState(null);

  // Track stats
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    // When the component mounts, get the width of the track
    if (trackRef.current) {
      const width = trackRef.current.getBoundingClientRect().width;
      setTrackWidth(Math.round(width));
    }
  }, []);

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
      xPos: 0,
      xDragOffset: 0,
    }));
  };

  const trackNumber = 4;
  const tracks = generateTracks(trackNumber);

  const handleDragStart = (e, sample) => {
    // get offset for placement
    const targetRect = e.target.getBoundingClientRect();
    const mouseX = e.clientX;
    const xDivMouse = mouseX - targetRect.left;
    console.log('Mouse X relative to div:', xDivMouse);

    // set offset for placement
    sample.xDragOffset = xDivMouse;

    setSampleSellected(sample);
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      <div className='track-status'>width: {trackWidth}</div>
      {tracks.map((track, index) => (
        <Track
          key={index}
          ref={trackRef}
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
