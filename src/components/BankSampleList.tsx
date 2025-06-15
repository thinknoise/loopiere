// src/components/BankSampleList.tsx

import banks from "../data/banks.json";
import React, { useEffect, useState, useCallback, FC } from "react";
import type { LocalSample } from "../types/audio";
import BankSample from "./BankSample";
import BankRecordingList from "./BankRecordingList";
import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import { addSampleToRegistry } from "../utils/sampleRegistry";
import "../style/bankTab.css";

const BankSampleList: FC = () => {
  const [bankSamples, setBankSamples] = useState<LocalSample[]>([]);
  const [bankFilename, setBankFilename] = useState<string>("recorded");

  const spawnSamples = useCallback((filename: string): void => {
    fetchAudio(filename)
      .then((data: any[] | null) => {
        if (!data) {
          setBankSamples([]);
          return;
        }

        const augmented: LocalSample[] = data.map((raw, idx) => {
          const name = raw.filename?.replace(/\.[^/.]+$/, "") ?? "Untitled";
          const sample: LocalSample = {
            ...raw,
            id: Date.now() + idx,
            title: name,
            type: "local",
            xPos: 0,
            onTrack: false,
            trackId: undefined,
          };
          addSampleToRegistry(sample);
          return sample;
        });

        setBankSamples(augmented);
      })
      .catch((err) => console.error("Error fetching audio data:", err));
  }, []);

  useEffect(() => {
    if (bankFilename !== "recorded") {
      spawnSamples(bankFilename);
    }
  }, [bankFilename, spawnSamples]);

  const tabFilenames = banks.map((b) => b.filename);
  tabFilenames.unshift("recorded");

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
          <BankRecordingList />
        ) : (
          bankSamples.map((bankSample, index) => (
            <BankSample
              key={index}
              sample={bankSample}
              onSampleSaved={() => {
                console.log("Sample saved:", bankSample.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BankSampleList;
