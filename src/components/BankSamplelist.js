import React, { useEffect, useState, useCallback } from "react";
import BankSample from "./BankSample";
import { fetchAudioData } from "../utils/fetchAudioData";
import banks from "../data/banks.json";
import { useRecorder } from "../hooks/useRecorder";
import { getAudioContext } from "../utils/audioManager";

import "../style/bankTab.css";

const BankSampleList = ({ handleDragStart }) => {
  const [buttons, setButtons] = useState([]);
  const [bankFilename, setBankFilename] = useState("recorded"); // default to "recorded" or any default
  const [recordedBuffer, setRecordedBuffer] = useState(null);

  const { startRecording, stopRecording, isRecording, audioBuffer } =
    useRecorder(getAudioContext());
  // Memoize the spawnButton function
  const spawnButton = useCallback((filename) => {
    fetchAudioData(filename)
      .then((data) => {
        if (data) {
          setButtons(data);
          // console.log('Audio JSON:', data, buttons);
        }
      })
      .catch((error) => {
        console.error("Error fetching or setting buttons:", error);
      });
  }, []);

  // Load the initial button data when the component mounts or when bankFilename changes
  useEffect(() => {
    spawnButton(bankFilename);
  }, [bankFilename, spawnButton]); // Add spawnButton to the dependency array

  useEffect(() => {
    if (audioBuffer) {
      setRecordedBuffer(audioBuffer);
      // console.log("Recorded buffer set!", audioBuffer);
    }
  }, [audioBuffer]);

  return (
    <div className="bank-tabs">
      {["recorded", ...banks.map((b) => b.filename)].map((filename, index) => (
        <button
          key={index}
          className={bankFilename === filename ? "tab selected" : "tab"}
          onClick={() => setBankFilename(filename)}
        >
          {filename === "recorded"
            ? "Recorded"
            : banks.find((b) => b.filename === filename)?.name || filename}
        </button>
      ))}{" "}
      <div className="button-container">
        {bankFilename === "recorded" ? (
          <div className="recording-ui">
            <button onClick={startRecording}>🎙 Start Rec</button>
            <button onClick={stopRecording}>⏹ Stop Rec</button>
            {isRecording && <p>Recording...</p>}
            {recordedBuffer && (
              <BankSample
                key="live-recorded"
                id="live-recorded"
                sample={{
                  id: crypto.randomUUID(), // ✅ Unique per placed sample
                  buffer: recordedBuffer,
                  filename: "Live Recording",
                  duration: recordedBuffer.duration,
                  path: null,
                  url: null,
                }}
              />
            )}
          </div>
        ) : (
          buttons.map((sample, index) => (
            <BankSample
              key={index}
              id={index}
              sample={sample}
              handleDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BankSampleList;
