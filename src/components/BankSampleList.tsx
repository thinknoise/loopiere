// src/components/BankSampleList.tsx

import React, { useEffect, useState, useCallback, FC, DragEvent } from "react";
import BankSample, { Sample } from "./BankSample";
import BankRecordingList from "./BankRecordingList";
import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import banks from "../data/banks.json";
import "../style/bankTab.css";
import { addSampleToRegistry } from "../utils/sampleRegistry";
import { SampleDescriptor } from "../utils/audioManager";

const BankSampleList: FC = () => {
  const [bankSamples, setBankSamples] = useState<Sample[]>([]);
  const [bankFilename, setBankFilename] = useState<string>("onehits.json");

  const spawnSamples = useCallback((filename: string): void => {
    fetchAudio(filename)
      .then((data: any[] | null) => {
        if (!data) {
          setBankSamples([]);
          return;
        }
        // Augment each raw sample with your metadata, then register it
        const augmented: SampleDescriptor[] = data.map((raw, idx) => {
          const sample: SampleDescriptor = {
            // pull in whatever the fetch gave you
            ...raw,
            // give it a unique numeric ID (bank-specific namespace)
            id: Date.now() + idx,
            // not yet placed on a track
            xPos: 0,
            onTrack: false,
            trackId: undefined,
            // filename, path/url, buffer, duration should already be on raw
          };
          addSampleToRegistry(sample);
          return sample;
        });

        // Now store your fully-typed samples for rendering
        setBankSamples(augmented);
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
