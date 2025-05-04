// LoopControls.js
import React, { memo } from "react";

/**
 * Presentational loop controls: buttons, slider, and status.
 * Props:
 *  - onStart, onStop, onClear, onSave, onDelete, onLoad: () => void | async
 *  - bpm: number
 *  - onBpmChange: (e) => void
 *  - sliderRef: React.RefObject
 *  - trackWidth: number
 *  - secsPerLoop: number
 *  - trackLeft: number
 *  - pixelsPerSecond: number
 */
const LoopControls = memo(
  ({
    onStart,
    onStop,
    onClear,
    onSave,
    onDelete,
    onLoad,
    bpm,
    onBpmChange,
    sliderRef,
    trackWidth,
    secsPerLoop,
    trackLeft,
    pixelsPerSecond,
  }) => (
    <div>
      <div className="button-group">
        <button className="play" onClick={onStart}>
          Play Tracks
        </button>
        <button className="stop" onClick={onStop}>
          Stop
        </button>
        <button className="clear" onClick={onClear}>
          Clear Loop
        </button>
        <br />
        <button className="save-sequence" onClick={onSave}>
          Save Loop
        </button>
        <button className="unsave-sequence" onClick={onDelete}>
          Delete Saved Loop
        </button>
        <button className="load-sequence" onClick={onLoad}>
          Load Saved Loop
        </button>
      </div>

      <br />

      <input
        ref={sliderRef}
        className="bpm-slider"
        type="range"
        min="40"
        max="200"
        value={bpm}
        onInput={onBpmChange}
      />

      <div className="track-status">
        <span>width: {trackWidth}px</span>
        <span>bpm: {bpm}</span>
        <span>loop seconds: {Math.round(secsPerLoop * 100) / 100} secs</span>
        <span>left = {trackLeft}</span>
        <span>pixels ps = {pixelsPerSecond}</span>
      </div>
    </div>
  )
);

export default LoopControls;
