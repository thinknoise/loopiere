import React, { useEffect, useState, useCallback } from 'react';
import SampleButton from './SampleButton';
import { fetchAudioData } from '../utils/fetchAudioData';
import banks from '../data/banks.json';
import '../style/bankTab.css';

const BankButtonList = ({ handleDragStart }) => {
  const [buttons, setButtons] = useState([]);
  const [bankFilename, setBankFilename] = useState(banks[0].filename); // Initialize state with the first bank filename

  // Memoize the spawnButton function
  const spawnButton = useCallback((filename) => {
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
  }, []);

  // Load the initial button data when the component mounts or when bankFilename changes
  useEffect(() => {
    spawnButton(bankFilename);
  }, [bankFilename, spawnButton]); // Add spawnButton to the dependency array

  return (
    <div className='bank-tabs'>
      {banks.map((bank, index) => (
        <button 
          className={bankFilename === bank.filename ? 'tab selected' : 'tab'} 
          key={index} 
          onClick={() => setBankFilename(bank.filename)}
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

export default BankButtonList;
