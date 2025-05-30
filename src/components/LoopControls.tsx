// src/components/LoopControls.tsx

import React, { memo, FC, Ref } from "react";
import { TiArrowLoop } from "react-icons/ti";
import { IoStopCircleOutline } from "react-icons/io5";
import {
  PiCloudArrowUpDuotone,
  PiEraserDuotone,
  PiCloudFogDuotone,
  PiCloudSlashDuotone,
} from "react-icons/pi";
import { Box, IconButton, Slider, Typography } from "@mui/material";

export interface LoopControlsProps {
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
  onClear: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onLoad: () => void | Promise<void>;
  emptyTracks: boolean;
  bpm: number;
  onBpmChange: (event: Event, value: number | number[]) => void;
  beatsPerLoop: number;
  onBeatsPerLoopChange: (value: number) => void;
  sliderRef: Ref<HTMLSpanElement>;
  trackWidth: number;
  secsPerLoop: number;
}

const LoopControls: FC<LoopControlsProps> = memo(
  ({
    onStart,
    onStop,
    onClear,
    onSave,
    onDelete,
    onLoad,
    emptyTracks,
    bpm,
    onBpmChange,
    beatsPerLoop,
    onBeatsPerLoopChange,
    sliderRef,
    trackWidth,
    secsPerLoop,
  }) => (
    <Box
      sx={{
        p: 2,
        bgcolor: "grey.900",
        borderRadius: 2,
        boxShadow: 3,
        width: "518px",
        mx: "auto",
        mb: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "center",
        }}
      >
        <IconButton
          onClick={onStart}
          aria-label="Play Loop"
          sx={{
            color: "common.white",
            width: 50,
            bgcolor: "success.main",
            "&:hover": { bgcolor: "success.dark" },
            transform: "rotate(180deg)",
          }}
        >
          <TiArrowLoop fontSize={35} />
        </IconButton>
        <IconButton
          onClick={onStop}
          aria-label="Stop"
          sx={{
            color: "common.white",
            bgcolor: "error.main",
            "&:hover": { bgcolor: "error.dark" },
          }}
        >
          <IoStopCircleOutline fontSize={32} />
        </IconButton>
        <IconButton
          onClick={onClear}
          aria-label="Clear Loop"
          sx={{
            color: "common.white",
            "&:hover": { bgcolor: "warning.dark" },
          }}
        >
          <PiEraserDuotone fontSize={32} />
        </IconButton>
        <IconButton
          onClick={onSave}
          disabled={emptyTracks}
          aria-label="Save Loop"
          sx={{
            color: "common.white",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
            "&:disabled": {
              color: "#3b3b3b",
              bgcolor: "grey",
              pointerEvents: "none",
              "&:hover": { bgcolor: "grey" },
            },
          }}
        >
          <PiCloudArrowUpDuotone fontSize={32} />
        </IconButton>
        <IconButton
          onClick={onLoad}
          aria-label="Load Loop"
          sx={{
            color: "common.white",
            bgcolor: "info.main",
            "&:hover": { bgcolor: "info.dark" },
          }}
        >
          <PiCloudFogDuotone fontSize={32} />
        </IconButton>
        <IconButton
          onClick={onDelete}
          aria-label="Delete Loop"
          sx={{
            color: "common.white",
            bgcolor: "error.main",
            "&:hover": { bgcolor: "purple.800" },
          }}
        >
          <PiCloudSlashDuotone fontSize={32} />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          color: "common.white",
        }}
      >
        <label htmlFor="beats-select">Beats per Loop:</label>
        <select
          id="beats-select"
          value={beatsPerLoop}
          onChange={(e) => onBeatsPerLoopChange(Number(e.target.value))}
          style={{
            padding: "6px 12px",
            fontSize: "1rem",
            borderRadius: "4px",
            backgroundColor: "#1e1e1e",
            color: "white",
            border: "1px solid #444",
          }}
        >
          {Array.from({ length: 13 }, (_, i) => i + 4).map((n) => (
            <option key={n} value={n}>
              {n} beats
            </option>
          ))}
        </select>
      </Box>

      <Slider
        ref={sliderRef}
        min={40}
        max={200}
        value={bpm}
        onChange={onBpmChange}
        valueLabelDisplay="on"
        valueLabelFormat={(value) => `${value} BPM`}
        sx={{
          color: "primary.main",
          mt: 5,
          "& .MuiSlider-valueLabel": {
            pv: 0,
            bgcolor: "primary.main",
            borderRadius: 1,
          },
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          color: "common.white",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2">Width: {trackWidth}px</Typography>
        <Typography variant="body2">Loop: {secsPerLoop.toFixed(2)}s</Typography>
      </Box>
    </Box>
  )
);

export default LoopControls;
