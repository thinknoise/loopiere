// src/components/Knob.tsx
import React, { useRef } from "react";
import "./knob.css";

export interface KnobProps {
  /** pan value from –1 (full left) to +1 (full right) */
  value: number;
  /** called with new pan value when user drags */
  onChange: (v: number) => void;
  /** diameter in px */
  size?: number;
  /** how many pixels of horizontal drag = full ±1 sweep */
  sensitivityPx?: number;
}

export const Knob: React.FC<KnobProps> = ({
  value,
  onChange,
  size = 20,
  sensitivityPx = 20,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);

  // new mapping: pan –1…+1 → angle 270°…90° via (value*90 + 360)%360
  //  value= 0 → (0*90+360)%360 = 0° (12 o’clock)
  //  value= 1 → (1*90+360)%360 = 90° (3 o’clock)
  //  value=-1 → (-1*90+360)%360 = 270° (9 o’clock)
  const angle = (value * 90 + 360) % 360;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // starting positions
    const startX = e.clientX;
    const startValue = value;

    // track movements
    const onMouseMove = (e2: MouseEvent) => {
      const dx = e2.clientX - startX;
      let newVal = startValue + dx / sensitivityPx;
      newVal = Math.max(-1, Math.min(1, newVal));
      if (Math.abs(newVal) < 0.01) {
        newVal = 0; // snap to zero if close enough
      }
      onChange(newVal);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const side = value < 0 ? "L" : "R"; // ensure consistent px string
  const sideAmount = Math.abs(value * 10).toFixed(1);
  return (
    <div className="knob-container">
      <div className="knob-label">
        {sideAmount} {side}
      </div>
      <div
        ref={knobRef}
        className="knob draggable"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        <div className="knob-outline" />
        <div
          className="knob-indicator"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
      </div>
    </div>
  );
};

export default Knob;
