import React, { useEffect, useState, useCallback } from "react";
import BankSample from "./BankSample";
import RecordingBankList from "./BankRecordingList";
import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import banks from "../data/banks.json";
import { getAudioContext } from "../utils/audioManager";

import "../style/bankTab.css";

/**
 * BankSampleList component
 * Renders bank samples or the recording list based on the selected tab
 */
const BankSampleList = ({ handleDragStart }) => {
  const [buttons, setButtons] = useState([]);
  const [bankFilename, setBankFilename] = useState("onehits.json");

  const spawnButton = useCallback((filename) => {
    fetchAudio(filename)
      .then((data) => {
        if (data) {
          setButtons(data);
        }
      })
      .catch((error) => console.error("Error fetching audio data:", error));
  }, []);

  useEffect(() => {
    spawnButton(bankFilename);
  }, [bankFilename, spawnButton]);

  return (
    <div className="bank-tabs">
      {[...banks.map((b) => b.filename), "recorded"].map((filename, index) => (
        <button
          key={index}
          className={bankFilename === filename ? "tab selected" : "tab"}
          onClick={() => setBankFilename(filename)}
        >
          {filename === "recorded"
            ? "Recorded"
            : banks.find((b) => b.filename === filename)?.name || filename}
        </button>
      ))}

      <div className="button-container">
        {bankFilename === "recorded" ? (
          <RecordingBankList handleDragStart={handleDragStart} />
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
