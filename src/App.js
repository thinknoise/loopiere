import React, { useState } from 'react';
import DraggableButton from './components/DraggableButton';
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


const DropZone = ({ handleDrop, handleDragOver }) => {
  return (
    <div
      className="drop-zone"
      onDrop={(e) => handleDrop(e)}
      onDragOver={(e) => handleDragOver(e)}
    >
      Drop Buttons Here
    </div>
  );
};

const App = () => {
  const [buttons, setButtons] = useState([]);
  const [draggedButtonId, setDraggedButtonId] = useState(null);

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
  
  const handleDragStart = (e, id) => {
    setDraggedButtonId(id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log(`Dropped Button ${draggedButtonId}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="App">
      <h1>Loopiere</h1>
      <button onClick={spawnButton}>Spawn Button</button>
      <div className="button-container">
        {buttons.map((sample, index) => (
          <DraggableButton key={index} id={index} sample={sample} handleDragStart={handleDragStart} />
        ))}
      </div>
      <DropZone handleDrop={handleDrop} handleDragOver={handleDragOver} />
    </div>
  );
};

export default App;
