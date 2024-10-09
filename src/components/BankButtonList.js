import React from 'react';
import '../style/bankTab.css';

const BankButtonList = ({ banks, setBankFilename, selected }) => {
  return (
    <div className='bank-tabs'>
      {banks.map((bank, index) => (
        <button 
          className={selected === bank.filename ? 'selected' : ''} 
          key={index} 
          onClick={() => setBankFilename(bank.filename)}
        >
          {bank.name}
        </button>
        // add bank buttons here
      ))}
    </div>
  );
};

export default BankButtonList;
