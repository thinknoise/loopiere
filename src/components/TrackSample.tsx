// src/components/TrackSample.tsx

import React, { useRef, useState, useCallback, FC, MouseEvent } from "react";
import type { SampleDescriptor } from "../utils/audioManager";
import type { UpdateSamplePositionFn } from "../types/sample";
import useAudioBuffer from "../hooks/useAudioBuffer";
import useEventListener from "../hooks/useEventListener";
import CompactWaveform from "./CompactWaveform";
import { bpmToSecondsPerLoop } from "../utils/timingHelpers";
import "../style/trackSample.css";

export interface TrackSampleProps {
  sample: SampleDescriptor;
  trackWidth: number;
  trackLeft: number;
  bpm: number;
  beatsPerLoop: number;
  /**
   * Edit or remove a sample.
   * @param sample Sample descriptor to update or remove.
   * @param remove If true, remove the sample; otherwise update it.
   */
  editSampleOfSamples: (sample: SampleDescriptor, remove?: boolean) => void;
  /**
   * Move a sample to a new fractional position.
   * @param sampleId The numeric ID of the sample.
   * @param xPosFraction New position as a fraction of track width (0–1).
   */
  updateSamplesWithNewPosition: UpdateSamplePositionFn;
}

const TrackSample: FC<TrackSampleProps> = ({
  sample,
  trackWidth,
  trackLeft,
  bpm,
  beatsPerLoop,
  editSampleOfSamples,
  updateSamplesWithNewPosition,
}) => {
  const { buffer: audioBuffer, duration: audioDuration } =
    useAudioBuffer(sample);

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
      const newPosFraction = newX / trackWidth;
      setDragState((prev) => ({ ...prev, isDragging: false, position: 0 }));
      updateSamplesWithNewPosition(sample, newPosFraction);
    },
    [
      dragState.isDragging,
      dragState.offset,
      trackLeft,
      trackWidth,
      updateSamplesWithNewPosition,
      sample,
    ]
  );

  useEventListener("mousemove", handleMouseMove);
  useEventListener("mouseup", handleMouseUp);

  const handleRemoveSample = (e: MouseEvent<HTMLButtonElement>) => {
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
