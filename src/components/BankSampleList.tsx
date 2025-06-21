// src/components/BankSampleList.tsx

import banks from "../data/banks.json";
import React, { useEffect, useState, useCallback, FC } from "react";
import type { LocalSample } from "../types/audio";

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "../utils/awsConfig";

import { addSampleToRegistry } from "../utils/sampleRegistry";

import BankSample from "./BankSample";
import BankRecordingList from "./BankRecordingList";

import "../style/bankTab.css";

const listBanksDirectories = async (): Promise<string[]> => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "banks/",
  });

  const response = await s3.send(command);
  const contents = response.Contents || [];

  return contents
    .map((obj) => obj.Key)
    .filter((key): key is string => key !== undefined)
    .map((key) => key.replace("banks/", ""));
};

const BankSampleList: FC = () => {
  const [bankSamples, setBankSamples] = useState<LocalSample[]>([]);
  const [bankSelection, setBankSelection] = useState<string>("recorded");
  const [bankFilenames, setBankFilenames] = useState<string[]>([]);
  const [awsKeys, setAwsKeys] = useState<string[]>([]);

  const spawnSamples = useCallback((folder: string) => {
    console.log("Spawning samples for folder:", folder, awsKeys);
    const samples = awsKeys
      .filter((key) => key.startsWith(`${folder}/`) && key.endsWith(".wav"))
      .map((key, idx): LocalSample => {
        console.log("Spawning sample:", key);
        const filename = key.split("/").pop() ?? "Untitled";
        const title = filename.replace(/\.[^/.]+$/, "");
        const sample: LocalSample = {
          id: Date.now() + idx,
          filename: key,
          title,
          type: "local",
          path: key,
        };
        addSampleToRegistry(sample);
        return sample;
      });

    setBankSamples(samples);
  }, []);

  useEffect(() => {
    listBanksDirectories()
      .then((directories) => {
        console.log("Available bank directories:", directories, bankSamples);
        const folders = new Set<string>();

        for (const key of directories) {
          if (key.endsWith("/")) continue; // skip folder "markers"
          const [folder] = key.split("/");
          if (folder) folders.add(folder);
        }

        setBankFilenames((prev) => ["recorded", ...Array.from(folders)]);
        setAwsKeys(directories);
      })
      .catch((err) => {
        console.error("Error listing bank directories:", err);
      });
  }, []);

  useEffect(() => {
    if (bankSelection !== "recorded") {
      console.log("Spawning samples for bank:", bankSelection);
      spawnSamples(bankSelection);
    }
  }, [bankSelection, spawnSamples, awsKeys]);

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
