// src/hooks/useRecorder.ts

import { useRef, useState, useCallback, useEffect } from "react";
import { trimAudioBufferSilence } from "../utils/audioUtils";

// Shape of the hook’s return value
export interface UseRecorderResult {
  isRecording: boolean;
  audioBuffer: AudioBuffer | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  getRecordedBlobURL: () => Promise<string | null>;
  inputLevel: number;
}

export function useRecorder(audioContext: AudioContext): UseRecorderResult {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const [inputLevel, setInputLevel] = useState(0);

  // START RECORDING
  const startRecording = useCallback(async (): Promise<void> => {
    console.log("start recording");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    // VU metter stuff
    const source = audioContext.createMediaStreamSource(stream);
    analyserRef.current = audioContext.createAnalyser();
    source.connect(analyserRef.current);

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current);
      const arrayBuffer = await blob.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      const trimmed = trimAudioBufferSilence(decoded, audioContext, 0.02, 10);
      setAudioBuffer(trimmed);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [audioContext]);

  const stopRecording = useCallback((): void => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    setIsRecording(false);
  }, []);

  const getRecordedBlobURL = useCallback(async (): Promise<string | null> => {
    if (!audioBuffer) return null;

    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const bufferSource = offlineCtx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(offlineCtx.destination);
    bufferSource.start();

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    return URL.createObjectURL(wavBlob);
  }, [audioBuffer]);

  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    let offset = 0;
    const writeUTF = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
      offset += str.length;
    };

    writeUTF("RIFF");
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    writeUTF("WAVEfmt ");
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    view.setUint32(offset, buffer.sampleRate, true);
    offset += 4;
    view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true);
    offset += 4;
    view.setUint16(offset, numOfChan * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeUTF("data");
    view.setUint32(offset, buffer.length * numOfChan * 2, true);
    offset += 4;

    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numOfChan; ch++) {
        let sample = buffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  }

  useEffect(() => {
    let rafId: number;
    function updateLevel() {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);
        // RMS level calculation:
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const minDb = -60;
        const maxDb = 0;
        let dB = 20 * Math.log10(rms);
        // If the input is completely silent, rms can be 0, and log10(0) is -Infinity. Let's protect against that:
        if (!isFinite(dB)) dB = minDb;
        // Normalize dB to a 0–1 scale for your bar
        let vu = (dB - minDb) / (maxDb - minDb);
        vu = Math.max(0, Math.min(1, vu)); // Clamp between 0 and 1
        setInputLevel(vu);
      }
      rafId = requestAnimationFrame(updateLevel);
    }

    if (isRecording) {
      updateLevel();
      return () => cancelAnimationFrame(rafId);
    } else {
      setInputLevel(0);
    }
  }, [isRecording]);

  return {
    isRecording,
    audioBuffer,
    startRecording,
    stopRecording,
    getRecordedBlobURL,
    inputLevel,
  };
}
