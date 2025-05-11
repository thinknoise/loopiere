// Rename App.js → App.tsx

import React from "react";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSampleList";
import TrackList from "./components/TrackList";
import { SampleDescriptor } from "./utils/audioManager";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <AudioContextProvider>
        <TrackList
          trackNumber={4}
          updateSamplesWithNewPosition={function (
            sample: SampleDescriptor,
            xPosFraction: number
          ): void {
            throw new Error("Function not implemented.");
          }}
        />
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
