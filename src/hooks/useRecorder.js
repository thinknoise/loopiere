import { useRef, useState, useCallback } from "react";

export function useRecorder(audioContext) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Refs to manage recorder, buffers, and the raw media stream
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    // 1. Capture microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    // 2. Create MediaRecorder
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    // 3. Collect data as it becomes available
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    // 4. When stopped, decode into an AudioBuffer
    recorder.onstop = async () => {
      console.log("Recording stopped");
      const blob = new Blob(chunksRef.current);
      const arrayBuffer = await blob.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
    };

    // 5. Start recording
    recorder.start();
    console.log("Recording started");
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [audioContext]);

  const stopRecording = useCallback(() => {
    // 1. Stop the MediaRecorder (fires onstop)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // 2. Turn off the microphone by stopping all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const getRecordedBlobURL = () => {
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

    return offlineCtx.startRendering().then((renderedBuffer) => {
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      return URL.createObjectURL(wavBlob);
    });
  };

  function audioBufferToWavBlob(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    function writeUTFBytes(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    let offset = 0;
    writeUTFBytes(view, offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    writeUTFBytes(view, offset, "WAVE");
    offset += 4;
    writeUTFBytes(view, offset, "fmt ");
    offset += 4;
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
    writeUTFBytes(view, offset, "data");
    offset += 4;
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

  return {
    isRecording,
    audioBuffer,
    startRecording,
    stopRecording,
    getRecordedBlobURL,
  };
}
