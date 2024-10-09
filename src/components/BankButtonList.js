import React, { useEffect, useState } from 'react';
import SampleButton from './SampleButton';
import { fetchAudioData } from '../utils/fetchAudioData';
import banks from '../data/banks.json';
import '../style/bankTab.css';

const BankButtonList = ({ handleDragStart }) => {
  const [buttons, setButtons] = useState([]);
  const [bankFilename, setBankFilename] = useState(banks[0].filename); // Initialize state with the first bank filename

  // Load the initial button data when the component mounts or when bankFilename changes
  useEffect(() => {
    spawnButton(bankFilename);
  }, [bankFilename]); 

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
        // add bank buttons here
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
