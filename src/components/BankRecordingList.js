import React, { useEffect, useState, useRef } from "react";
import BankSample from "./BankSample";
import { useRecorder } from "../hooks/useRecorder";
import { useAudioContext } from "./AudioContextProvider";
import { BiSolidMicrophoneAlt } from "react-icons/bi";
import { PiMicrophoneSlashDuotone } from "react-icons/pi";

/**
 * BankRecordingList component
 * Handles multiple recordings and exposes them as draggable samples
 * Prevents duplicate entries by tracking processed audioBuffer references
 */
const BankRecordingList = ({ handleDragStart }) => {
  const [recordings, setRecordings] = useState([]);
  const processedRef = useRef(new Set());
  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBuffer,
    getRecordedBlobURL,
  } = useRecorder(useAudioContext());

  useEffect(() => {
    if (!audioBuffer) return;
    // Skip if this buffer has already been processed
    if (processedRef.current.has(audioBuffer)) {
      return;
    }
    processedRef.current.add(audioBuffer);
    let isMounted = true;

    (async () => {
      try {
        const url = await getRecordedBlobURL();
        if (!isMounted) return;

        setRecordings((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            buffer: audioBuffer,
            filename: `Recording ${prev.length + 1}`,
            duration: audioBuffer.duration,
            path: url,
            url,
          },
        ]);
      } catch (error) {
        console.error("Error generating recording URL", error);
      }
    })();

    return () => {
      isMounted = false;
    };
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
            color: "white",
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
            color: "red",
            opacity: isRecording ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      </button>
      {isRecording && <p>Recording...</p>}
      <div className="samples">
        {recordings.map((sample) => (
          <BankSample
            key={sample.id}
            id={sample.id}
            sample={sample}
            handleDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default BankRecordingList;
