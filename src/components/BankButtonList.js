import React from 'react';
import '../style/bankTab.css';

const BankButtonList = ({ banks, spawnButton }) => {
  return (
    <div className='bank-tabs'>
      {banks.map((bank, index) => (
        <button key={index} onClick={() => spawnButton(bank.filename)}>
          {bank.name}
        </button>
      ))}
    </div>
  );
};

export default BankButtonList;
