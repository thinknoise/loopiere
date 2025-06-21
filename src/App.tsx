// App.tsx

import React from "react";
import packageJson from "../package.json";
import { AudioContextProvider } from "./components/AudioContextProvider";
import { TrackAudioStateProvider } from "./context/TrackAudioStateContext";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";
import LoopControls from "./components/LoopControls";

import "./style/App.css";

const App: React.FC = () => {
  const appVersion = packageJson.version;

  return (
    <div className="App">
      <h1>
        Loopiere
        <img
          src="/loopiere/icon/android-chrome-192x192.png"
          alt="Loopiere Icon"
          className="app-icon"
        />
      </h1>
      <p className="version">{appVersion}</p>
      <AudioContextProvider>
        <TrackAudioStateProvider>
          <LoopControls />
          <TrackList />
        </TrackAudioStateProvider>
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
