// LoopControls.js
import React, { memo } from "react";
import { TiArrowLoop } from "react-icons/ti";
import { IoStopCircleOutline } from "react-icons/io5";
import {
  PiCloudArrowUpDuotone,
  PiEraserDuotone,
  PiCloudFogDuotone,
  PiCloudSlashDuotone,
} from "react-icons/pi";
import { Box, IconButton, Slider, Typography } from "@mui/material";

/**
 * Presentational loop controls: icon buttons, slider, and status.
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
    <Box
      sx={{
        p: 2,
        bgcolor: "grey.900",
        borderRadius: 2,
        boxShadow: 3,
        width: "518px",
        mx: "auto", // centers the Box horizontally
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
          aria-label="Save Loop"
          sx={{
            color: "common.white",
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
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
            pv: 0, // reduce padding to half
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
        {/* <Typography variant="body2">Left: {trackLeft}px</Typography> */}
        <Typography variant="body2">Pixels/sec: {pixelsPerSecond}</Typography>
      </Box>
    </Box>
  )
);

export default LoopControls;
