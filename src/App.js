import React from "react";
import { AudioContextProvider } from "./components/AudioContextProvider";
import BankSampleList from "./components/BankSamplelist";
import TrackList from "./components/TrackList";

const App = () => {
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <AudioContextProvider>
        <TrackList trackNumber={4} />
        <BankSampleList />
      </AudioContextProvider>
    </div>
  );
};

export default App;
