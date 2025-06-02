// src/hooks/useTrackWidth.ts

import { useState, useEffect, RefObject } from "react";
import { useLoopSettings } from "../context/LoopSettingsContext";

/**
 * Custom hook that measures the width and left offset of a referenced element.
 * @param trackRef - RefObject pointing to an HTMLElement (e.g., a div)
 * @returns A tuple [width, leftOffset] in pixels
 */
export default function useTrackWidth(
  trackRef: RefObject<HTMLElement>
): [number, number] {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const [trackLeft, setTrackLeft] = useState<number>(0);
  const { beatsPerLoop } = useLoopSettings();

  useEffect(() => {
    const updateTrackMeasurements = (): void => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setTrackWidth(Math.round(rect.width));
      setTrackLeft(Math.round(rect.left));
    };

    // Initial measurement
    updateTrackMeasurements();

    // Update on window resize
    window.addEventListener("resize", updateTrackMeasurements);
    return () => {
      window.removeEventListener("resize", updateTrackMeasurements);
    };
  }, [trackRef, beatsPerLoop]);

  return [trackWidth, trackLeft];
}
