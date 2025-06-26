// src/components/BankSampleList.tsx
import React, { useEffect, useState, useCallback, FC } from "react";
import type { AwsSampleType, BaseSample } from "../types/audio";

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "../utils/awsConfig";

import { addSampleToRegistry } from "../utils/sampleRegistry";

import BankSample from "./BankSample";
import BankRecorder from "./BankRecorder";

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
  const [bankSamples, setBankSamples] = useState<BaseSample[]>([]);
  const [bankSelection, setBankSelection] = useState<string>("recorded");
  const [bankFilenames, setBankFilenames] = useState<string[]>([]);
  const [awsKeys, setAwsKeys] = useState<string[]>([]);

  const fetchBankDirectories = async () => {
    try {
      const directories = await listBanksDirectories();
      const folders = new Set<string>();

      for (const key of directories) {
        if (key.endsWith("/")) continue; // skip folder markers
        const [folder] = key.split("/");
        if (folder) folders.add(folder);
      }

      setBankFilenames([...folders]);
      setAwsKeys(directories);
    } catch (err) {
      console.error("Error listing bank directories:", err);
    }
  };

  useEffect(() => {
    fetchBankDirectories(); // fire it once on mount
  }, []);

  const spawnSamples = useCallback(
    (folder: string) => {
      // console.log("Spawning samples for folder:", folder);
      const samples = awsKeys
        .filter((key) => key.startsWith(`${folder}/`) && key.endsWith(".wav"))
        .map((key, idx): AwsSampleType => {
          const filename = key.split("/").pop() ?? "Untitled";
          const title = filename.replace(/\.[^/.]+$/, "");
          const sample: BaseSample = {
            id: Date.now() + idx,
            filename: key,
            title,
            type: "aws", // was local, but now we are using AWS
            path: key,
          };
          addSampleToRegistry(sample);
          return sample;
        });

      setBankSamples(samples);
    },
    [awsKeys]
  );

  useEffect(() => {
    // console.log("Spawning samples for bank:", bankSelection);
    spawnSamples(bankSelection);
  }, [bankSelection, spawnSamples]);

  return (
    <div className="bank-tabs">
      {bankFilenames.map((filename, i) => (
        <button
          key={i}
          className={bankSelection === filename ? "tab selected" : "tab"}
          onClick={() => setBankSelection(filename)}
        >
          {filename}
        </button>
      ))}

      <div className="button-container">
        {bankSamples.map((bankSample, index) => (
          <BankSample
            key={index}
            sample={bankSample}
            updateBankSamples={() => {
              console.log("recordings saved, refreshing...");
              fetchBankDirectories();
            }}
          />
        ))}
        <BankRecorder fetchBankDirectories={fetchBankDirectories} />
      </div>
    </div>
  );
};

export default BankSampleList;
