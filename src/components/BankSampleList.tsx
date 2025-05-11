// src/components/BankSampleList.tsx

import React, { useEffect, useState, useCallback, FC, DragEvent } from "react";
import BankSample, { Sample } from "./BankSample";
import BankRecordingList from "./BankRecordingList";
import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import banks from "../data/banks.json";
import "../style/bankTab.css";

const BankSampleList: FC = () => {
  const [bankSamples, setBankSamples] = useState<Sample[]>([]);
  const [bankFilename, setBankFilename] = useState<string>("onehits.json");

  const spawnSamples = useCallback((filename: string): void => {
    fetchAudio(filename)
      .then((data: Sample[] | null) => {
        if (data) setBankSamples(data);
      })
      .catch((err) => console.error("Error fetching audio data:", err));
  }, []);

  useEffect(() => {
    spawnSamples(bankFilename);
  }, [bankFilename, spawnSamples]);

  const tabFilenames = banks.map((b) => b.filename).concat("recorded");

  return (
    <div className="bank-tabs">
      {/* Tabs */}
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

      {/* Sample buttons */}
      <div className="button-container">
        {bankFilename === "recorded" ? (
          <BankRecordingList />
        ) : (
          bankSamples.map((bankSample, index) => (
            <BankSample key={index} sample={bankSample} />
          ))
        )}
      </div>
    </div>
  );
};

export default BankSampleList;
