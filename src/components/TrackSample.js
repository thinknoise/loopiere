import React, { useRef, useState, useCallback } from "react";
import useAudioBuffer from "../hooks/useAudioBuffer";
import useEventListener from "../hooks/useEventListener";
import CompactWaveform from "./CompactWaveform";
import "../style/trackSample.css";

const TrackSample = ({
  sample,
  trackWidth,
  trackLeft,
  editSampleOfSamples,
  bpm,
  updateSamplesWithNewPosition,
}) => {
  const { buffer: audioBuffer, duration: audioDuration } =
    useAudioBuffer(sample);

  const [dragState, setDragState] = useState({
    isDragging: false,
    offset: 0,
    position: 0,
  });

  const wrapperRef = useRef(null);
  const secsPerMeasure = (60 / bpm) * 4;

  // Compute raw width (in pixels) based on duration and track width
  const rawWidth = audioDuration
    ? Math.floor((audioDuration / secsPerMeasure) * trackWidth)
    : 0;

  // Clamp width between 1px and trackWidth
  const sampleWidth = Math.max(1, Math.min(rawWidth, trackWidth));

  // Determine left offset: either during drag or from sample.xPos
  const sampleLeft = dragState.isDragging
    ? dragState.position
    : sample.xPos * trackWidth;

  // Start dragging
  const handleMouseDown = (e) => {
    const rect = wrapperRef.current.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    setDragState({
      isDragging: true,
      offset,
      position: sample.xPos * trackWidth,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragState.isDragging) return;
      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      setDragState((prev) => ({ ...prev, position: newX }));
    },
    [dragState.isDragging, dragState.offset, trackLeft]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (!dragState.isDragging) return;
      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      const newPosFraction = newX / trackWidth;
      setDragState((prev) => ({ ...prev, isDragging: false, position: 0 }));
      updateSamplesWithNewPosition(sample.id, newPosFraction);
    },
    [
      dragState.isDragging,
      dragState.offset,
      trackLeft,
      trackWidth,
      sample.id,
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

  return (
    <div
      ref={wrapperRef}
      className="track-btn-wrapper"
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: `${sampleLeft}px`,
        top: 0,
        width: `${sampleWidth}px`,
        cursor: dragState.isDragging ? "grabbing" : "grab",
      }}
    >
      <button className="remove-track-btn" onClick={handleRemoveSample} />
      <button className="track-sample-btn" style={{ width: "100%" }}>
        <span>{sample.filename.replace(/\.\w+$/, "")}</span>
        {audioBuffer && (
          <CompactWaveform
            buffer={audioBuffer}
            width={sampleWidth}
            height={53}
          />
        )}
      </button>
    </div>
  );
};

export default TrackSample;
