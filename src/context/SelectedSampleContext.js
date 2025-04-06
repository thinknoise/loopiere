import React, { createContext, useContext, useState } from 'react';

// Create the context
const SelectedSampleContext = createContext(); // Default export

// Create the provider component
const SelectedSampleProvider = ({ children }) => {
  const [selectedSample, setSelectedSample] = useState(null);

  const updateSelectedSample = (sample) => {
    setSelectedSample(sample);
  };

  return (
    <SelectedSampleContext.Provider value={{ selectedSample, updateSelectedSample }}>
      {children}
    </SelectedSampleContext.Provider>
  );
};

// Create a custom hook to use the SelectedSampleContext
const useSelectedSample = () => {
  return useContext(SelectedSampleContext);
};

export default SelectedSampleProvider; // Default export
export { useSelectedSample }; // Named export
