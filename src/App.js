import React from 'react';
import SelectedSampleProvider from './context/SelectedSampleContext';
import BankSampleList from './components/BankSamplelist';
import TrackList from './components/TrackList';

const App = () => {
  return (
    <SelectedSampleProvider>
      <div className="App">
        <h1>Loopiere</h1>
        <TrackList trackNumber={4} />
        <BankSampleList />
      </div>
    </SelectedSampleProvider>
  );
};

export default App;
