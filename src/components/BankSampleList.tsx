// src/components/BankSampleList.tsx

import React, { useEffect, useState, useCallback, FC, DragEvent } from "react";
import BankSample from "./BankSample";
import RecordingBankList from "./BankRecordingList";
import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import banks from "../data/banks.json";
import "../style/bankTab.css";

// shape of entries in banks.json
interface Bank {
  filename: string;
  name: string;
}

// replace this with a better sample type when you know it
export interface Sample {
  [key: string]: any;
}

const BankSampleList: FC = () => {
  const [buttons, setButtons] = useState<Sample[]>([]);
  const [bankFilename, setBankFilename] = useState<string>("onehits.json");

  // load samples when tab changes
  const spawnButton = useCallback((filename: string): void => {
    fetchAudio(filename)
      .then((data: Sample[] | null) => {
        if (data) setButtons(data);
      })
      .catch((err) => console.error("Error fetching audio data:", err));
  }, []);

  useEffect(() => {
    spawnButton(bankFilename);
  }, [bankFilename, spawnButton]);

  // internal drag‐start handler
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, index: number) => {
      const sample = buttons[index];
      const rect = e.currentTarget.getBoundingClientRect();
      const xDragOffset = e.clientX - rect.left;
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ ...sample, xDragOffset })
      );
    },
    [buttons]
  );

  const tabFilenames = banks.map((b) => b.filename).concat("recorded");

  return (
    <div className="bank-tabs">
      {tabFilenames.map((filename, i) => (
        <button
          key={i}
          className={bankFilename === filename ? "tab selected" : "tab"}
          onClick={() => setBankFilename(filename)}
        >
          {filename === "recorded"
            ? "Recorded"
            : banks.find((b) => b.filename === filename)?.name ?? filename}
        </button>
      ))}

      <div className="button-container">
        {bankFilename === "recorded" ? (
          <RecordingBankList handleDragStart={handleDragStart} />
        ) : (
          buttons.map((sample, idx) => (
            <BankSample
              key={idx}
              id={idx}
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
