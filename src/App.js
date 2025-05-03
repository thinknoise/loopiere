import React from 'react';
import './style/App.css';
import SelectedSampleProvider from './context/SelectedSampleContext';
import DragProvider from './context/DragContext';
import TrackList from './components/TrackList';
import BankSampleList from './components/BankSamplelist';
import DragLayer from './components/DragLayer';

const App = () => {
  return (
    <DragProvider>
      <SelectedSampleProvider>
        <div className="App">
          <h1>Loopiere</h1>
          <TrackList trackNumber={4} />
          <BankSampleList />
          <DragLayer />
        </div>
      </SelectedSampleProvider>
    </DragProvider>
  );
};

export default App;
