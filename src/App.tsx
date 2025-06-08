// Rename App.js → App.tsx

import React from "react";
import packageJson from "../package.json";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";

import "./style/App.css";

const App: React.FC = () => {
  const appVersion = packageJson.version;
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <p className="version">Version: {appVersion}</p>
      <AudioContextProvider>
        <TrackList />
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
