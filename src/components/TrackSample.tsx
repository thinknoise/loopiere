// src/components/TrackSample.tsx

import React, { useRef, useState, useCallback, FC, MouseEvent } from "react";
import type { TrackSample as Sample } from "../types/audio";
import useAudioBuffer from "../hooks/useAudioBuffer";
import useEventListener from "../hooks/useEventListener";
import CompactWaveform from "./CompactWaveform";
import { bpmToSecondsPerLoop } from "../utils/timingUtils";
import "../style/trackSample.css";
import { useTrackSampleStore } from "../stores/trackSampleStore";
import { useLoopSettings } from "../context/LoopSettingsContext";

export interface TrackSampleProps {
  sample: Sample;
  trackWidth: number;
  trackLeft: number;
}

const TrackSample: FC<TrackSampleProps> = ({
  sample,
  trackWidth,
  trackLeft,
}) => {
  const { buffer: audioBuffer, duration: audioDuration } =
    useAudioBuffer(sample);

  const { bpm, beatsPerLoop } = useLoopSettings();

  const xPos = sample.xPos ?? 0;

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    offset: number;
    position: number;
  }>({
    isDragging: false,
    offset: 0,
    position: 0,
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const secsPerMeasure = bpmToSecondsPerLoop(bpm, beatsPerLoop);

  // raw pixel width based on duration & trackWidth
  const rawWidth = audioDuration
    ? Math.floor((audioDuration / secsPerMeasure) * trackWidth)
    : 0;

  const sampleWidth = Math.max(1, Math.min(rawWidth, trackWidth));

  // use the non-optional xPos here:
  const sampleLeft = dragState.isDragging
    ? dragState.position
    : xPos * trackWidth;

  // Begin drag: record offset
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragState({
      isDragging: true,
      offset: e.clientX - rect.left,
      position: xPos * trackWidth,
    });
  };

  // Move drag
  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!dragState.isDragging) return;
      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      setDragState((prev) => ({ ...prev, position: newX }));
    },
    [dragState.isDragging, dragState.offset, trackLeft]
  );

  // End drag: compute fraction & update
  const handleMouseUp = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!dragState.isDragging) return;
      const newX = Math.max(0, e.clientX - trackLeft - dragState.offset);
      const fraction = newX / trackWidth;

      useTrackSampleStore.setState((state) => ({
        allSamples: state.allSamples.map((s) =>
          s.id === sample.id ? { ...s, xPos: fraction } : s
        ),
      }));

      setDragState((prev) => ({ ...prev, isDragging: false, position: 0 }));
    },
    [dragState.isDragging, dragState.offset, sample.id, trackLeft, trackWidth]
  );
  useEventListener("mousemove", handleMouseMove);
  useEventListener("mouseup", handleMouseUp);

  const handleRemoveSample = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const prev = useTrackSampleStore.getState().allSamples;
    useTrackSampleStore
      .getState()
      .setAllSamples(prev.filter((s) => s.id !== sample.id));
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
      <button
        className="remove-track-btn"
        onClick={handleRemoveSample}
        aria-label="Remove sample"
      />
      <button className="track-sample-btn" style={{ width: "100%" }}>
        <span>{sample.filename?.replace(/\.\w+$/, "")}</span>
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
