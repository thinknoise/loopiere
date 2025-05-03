import React from "react";
import BankSampleList from "./components/BankSamplelist";
import TrackList from "./components/TrackList";

const App = () => {
  return (
    <div className="App">
      <h1>Loopiere</h1>
      <TrackList trackNumber={4} />
      <BankSampleList />
    </div>
  );
};

export default App;
