// src/components/BankRecordingList.tsx

import React, { useEffect, useState, FC } from "react";
import BankSample from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { BiSolidMicrophoneAlt } from "react-icons/bi";
import { PiMicrophoneSlashDuotone } from "react-icons/pi";
import { addSampleToRegistry } from "../utils/sampleRegistry";
import { SampleDescriptor } from "../utils/audioManager";
import "../style/bankTab.css";

export interface Recording extends SampleDescriptor {
  id: number; // numeric
  buffer: AudioBuffer; // must be present
  url: string; // must have a blob URL
  filename: string; // must have a human label
  duration: number; // must have duration
  // trackId/xPos/onTrack/startTime are still optional until placement
}

const BankRecordingList: FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
  } = useRecorder(useAudioContext()) as any;

  useEffect(() => {
    if (!audioBuffer) return;

    (async () => {
      const url = await getRecordedBlobURL();

      setRecordings((prevRecordings) => {
        // compute the new filename from prevRecordings, not the outer `recordings`
        const filename = `Recording ${prevRecordings.length + 1}`;

        const newRecording: Recording = {
          id: Date.now(),
          buffer: audioBuffer,
          url,
          filename,
          duration: audioBuffer.duration,
          path: url,
          xPos: 0,
          onTrack: false,
          trackId: undefined,
        };

        // register it after constructing (so registry never misses it)
        addSampleToRegistry(newRecording);

        // return the new array
        return [...prevRecordings, newRecording];
      });
    })();
  }, [audioBuffer, getRecordedBlobURL]);

  return (
    <div className="recording-ui">
      <button
        className="record-btn-wrapper"
        style={{ zIndex: isRecording ? 0 : 1 }}
        onClick={startRecording}
      >
        <BiSolidMicrophoneAlt
          size={32}
          style={{
            opacity: isRecording ? 0 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </button>

      <button
        className="record-btn-wrapper"
        style={{ zIndex: isRecording ? 1 : 0 }}
        onClick={stopRecording}
      >
        <PiMicrophoneSlashDuotone
          size={32}
          style={{
            opacity: isRecording ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </button>
      {isRecording && <p>Recording...</p>}
      <div className="samples">
        {recordings.map((recording) => (
          <BankSample key={recording.id} sample={recording} />
        ))}
      </div>
    </div>
  );
};

export default BankRecordingList;
