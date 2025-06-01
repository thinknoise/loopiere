// Rename App.js → App.tsx

import React, { useState } from "react";
import type { TrackSample } from "./types/audio";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";

import "./style/App.css";

const App: React.FC = () => {
  const [trackNumber, setTrackNumber] = useState(4);
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <AudioContextProvider>
        <TrackList
          trackNumber={trackNumber}
          updateSamplesWithNewPosition={function (
            sample: TrackSample,
            xPosFraction: number
          ): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="track-add-remove">
          <button onClick={() => setTrackNumber((n: number) => n + 1)}>
            +
          </button>
          <button onClick={() => setTrackNumber((n: number) => n - 1)}>
            -
          </button>
        </div>
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
