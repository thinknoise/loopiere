// Rename App.js → App.tsx

import React from "react";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";

import "./style/App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <AudioContextProvider>
        <TrackList />
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
