import React from 'react';
import '../style/bankTab.css';

const BankButtonList = ({ banks, spawnButton, selected }) => {
  console.log(selected)
  return (
    <div className='bank-tabs'>
      {banks.map((bank, index) => (
        <button 
          className={selected === bank.filename ? 'selected' : ''} 
          key={index} 
          onClick={() => spawnButton(bank.filename)}
        >
          {bank.name}
        </button>
      ))}
    </div>
  );
};

export default BankButtonList;
