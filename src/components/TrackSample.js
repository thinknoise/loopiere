import React, { useEffect, useRef, useState, useCallback } from "react";
import CompactWaveform from "./CompactWaveform";
import { loadAudio } from "../utils/audioManager";
import useEventListener from "../hooks/useEventListener";
import "../style/trackSample.css";

const TrackSample = ({
  sample,
  trackWidth,
  trackLeft,
  editSampleOfSamples,
  bpm,
  updateSamplesWithNewPosition,
}) => {
  const [audioState, setAudioState] = useState({
    buffer: null,
    duration: null,
  });

  const [dragState, setDragState] = useState({
    isDragging: false,
    initialX: 0,
    offset: 0,
    position: 0,
  });

  const wrapperRef = useRef(null);
  const secsPerMeasure = (60 / bpm) * 4;

  useEffect(() => {
    const loadAudioFile = async () => {
      const fullPath = `/samples/${sample.path}`;
      const buffer = await loadAudio(fullPath);
      setAudioState({
        buffer,
        duration: Math.round(buffer.duration * 10) / 10,
      });
    };
    loadAudioFile();
  }, [sample.path]);

  const handleMouseDown = (e) => {
    const rect = wrapperRef.current.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    const initialX = sample.xPos * trackWidth;

    setDragState({
      isDragging: true,
      initialX,
      offset,
      position: initialX,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragState.isDragging) return;

      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      setDragState((prev) => ({
        ...prev,
        position: newX,
      }));
    },
    [dragState.isDragging, dragState.offset, trackLeft]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (!dragState.isDragging) return;

      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      const newXPositionPercentage = newX / trackWidth;
      // console.log("Dropping sample", sample.id, "→", newXPositionPercentage);

      setDragState((prev) => ({
        ...prev,
        isDragging: false,
        position: 0,
      }));

      // ✅ Use the passed `sample`, not a stale ref
      updateSamplesWithNewPosition(sample.id, newXPositionPercentage);
    },
    [
      dragState.isDragging,
      dragState.offset,
      trackLeft,
      trackWidth,
      sample,
      updateSamplesWithNewPosition,
    ]
  );

  useEventListener("mousemove", handleMouseMove);
  useEventListener("mouseup", handleMouseUp);

  const handleRemoveSample = (e) => {
    e.stopPropagation();
    e.preventDefault();
    editSampleOfSamples(sample, true);
  };

  const sampleLeft = dragState.isDragging
    ? dragState.position
    : sample.xPos * trackWidth;

  return (
    <div
      ref={wrapperRef}
      className="track-btn-wrapper"
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: `${sampleLeft}px`,
        top: 0,
        width: audioState.duration
          ? `${(audioState.duration / secsPerMeasure) * trackWidth}px`
          : "auto",
        cursor: dragState.isDragging ? "grabbing" : "grab",
      }}
    >
      <button
        className="remove-track-btn"
        onClick={handleRemoveSample}
      ></button>
      <button className="track-sample-btn" style={{ width: "100%" }}>
        <span>{sample.filename.slice(0, -4)}</span>
        <CompactWaveform buffer={audioState.buffer} />
      </button>
    </div>
  );
};

export default TrackSample;
