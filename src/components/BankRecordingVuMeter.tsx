import React from "react";

export const VUMeter: React.FC<{ inputLevel: number }> = ({ inputLevel }) => (
  <div className="vu-group">
    <div className="vu-meter">
      <div
        className="vu-meter-bar"
        style={{
          height: `${Math.min(100, inputLevel * 100)}%`,
          background:
            inputLevel > 0.85
              ? "#f00"
              : inputLevel > 0.4
              ? "#ffc800"
              : "#00ff8c",
          transition: "height 0.12s cubic-bezier(.4,2.2,.8,1.0)",
        }}
      />
    </div>
    <svg
      className="vu-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Speaker with wave"
    >
      <polygon points="5 9 9 9 13 5 13 19 9 15 5 15 5 9" fill="#53b4fdd3" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7" stroke="#53b4fdd3" />
      <path d="M20 5a9 9 0 0 1 0 14" stroke="rgba(83, 180, 253, 0.83)" />
    </svg>
  </div>
);
