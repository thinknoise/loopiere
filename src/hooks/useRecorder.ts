// src/hooks/useRecorder.ts

import { useRef, useState, useCallback, useEffect } from "react";
import { trimAudioBufferSilence } from "../utils/audioUtils";

// Shape of the hook’s return value
export interface UseRecorderResult {
  isRecording: boolean;
  audioBuffer: AudioBuffer | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  getRecordedBlobURL: () => Promise<{ blob: Blob; url: string } | null>;
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

  const getRecordedBlobURL = useCallback(async (): Promise<{
    blob: Blob;
    url: string;
  } | null> => {
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
    const url = URL.createObjectURL(wavBlob);

    return { blob: wavBlob, url };
  }, [audioBuffer]);

  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const length = buffer.length * numChannels * (bitDepth / 8);
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);

    /* RIFF chunk descriptor */
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + length, true); // chunkSize
    writeString(view, 8, "WAVE");

    /* fmt subchunk */
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // subchunk1Size
    view.setUint16(20, format, true); // audioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byteRate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // blockAlign
    view.setUint16(34, bitDepth, true);

    /* data subchunk */
    writeString(view, 36, "data");
    view.setUint32(40, length, true);

    // Write interleaved PCM samples
    const offset = 44;
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let sampleIdx = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset + sampleIdx, sample * 0x7fff, true);
        sampleIdx += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  }

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
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
