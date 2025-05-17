// Rename App.js → App.tsx

import React, { useState } from "react";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";
import { SampleDescriptor } from "./utils/audioManager";
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
            sample: SampleDescriptor,
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
