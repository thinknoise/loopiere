import React from 'react';

const BankButtonList = ({ banks, spawnButton }) => {
  return (
    <div>
      {banks.map((bank, index) => (
        <button key={index} onClick={() => spawnButton(bank.filename)}>
          {bank.name}
        </button>
      ))}
    </div>
  );
};

export default BankButtonList;
