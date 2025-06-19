// src/components/BankSampleList.tsx

import banks from "../data/banks.json";
import React, { useEffect, useState, useCallback, FC } from "react";
import type { LocalSample } from "../types/audio";

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "../utils/awsConfig";

import { fetchAudioData as fetchAudio } from "../utils/fetchAudioData";
import { addSampleToRegistry } from "../utils/sampleRegistry";

import BankSample from "./BankSample";
import BankRecordingList from "./BankRecordingList";

import "../style/bankTab.css";

const listBankJsonFiles = async (): Promise<string[]> => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "data/",
  });

  const response = await s3.send(command);
  const contents = response.Contents || [];

  return contents
    .map((obj) => obj.Key)
    .filter((key): key is string => !!key && key.endsWith(".json"))
    .map((key) => key.replace("data/", ""));
};

const BankSampleList: FC = () => {
  const [bankSamples, setBankSamples] = useState<LocalSample[]>([]);
  const [bankSelection, setBankSelection] = useState<string>("recorded");
  const [bankFilenames, setBankFilenames] = useState<string[]>(["recorded"]);

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
    listBankJsonFiles()
      .then((filenames) => {
        setBankFilenames(["recorded", ...filenames]);
      })
      .catch((err) => {
        console.error("Error listing bank JSON files:", err);
      });
  }, []);

  useEffect(() => {
    if (bankSelection !== "recorded") {
      spawnSamples(bankSelection);
    }
  }, [bankSelection, bankFilenames, spawnSamples]);

  return (
    <div className="bank-tabs">
      {bankFilenames.map((filename, i) => (
        <button
          key={i}
          className={bankSelection === filename ? "tab selected" : "tab"}
          onClick={() => setBankSelection(filename)}
        >
          {filename === "recorded"
            ? "Recorded"
            : banks.find((b) => b.filename === filename)?.name ?? filename}
        </button>
      ))}

      <div className="button-container">
        {bankSelection === "recorded" ? (
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
