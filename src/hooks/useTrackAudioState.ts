import { useRef, useState, useEffect, useMemo } from "react";

export function useTrackAudioState(trackNumber: number) {
  const gainNodes = useRef<Map<number, GainNode>>(new Map());
  const panNodes = useRef<Map<number, StereoPannerNode>>(new Map());
  const highpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());
  const lowpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());

  const trackFiltersRef = useRef<Map<string, AudioNode>>(new Map());

  const [trackFrequencies, setTrackFrequencies] = useState<
    Record<number, number>
  >({});
  const [trackHighpassFrequencies, setTrackHighpassFrequencies] = useState<
    Record<number, number>
  >({});
  const [trackGains, setTrackGains] = useState<Record<number, number>>({});
  const [trackPans, setTrackPans] = useState<Record<number, number>>({});
  const [trackBypasses, setTrackBypasses] = useState<{
    lowpass: Record<number, boolean>;
    highpass: Record<number, boolean>;
  }>({
    lowpass: {},
    highpass: {},
  });

  // Ensure new tracks have default bypass state
  useEffect(() => {
    for (let id = 1; id <= trackNumber; id++) {
      setTrackBypasses((prev) => ({
        lowpass: { ...prev.lowpass, [id]: prev.lowpass[id] ?? false },
        highpass: { ...prev.highpass, [id]: prev.highpass[id] ?? false },
      }));
    }
  }, [trackNumber]);

  const trackAudioState = useMemo(
    () => ({
      filters: trackFiltersRef,
      frequencies: trackFrequencies,
      highpassFrequencies: trackHighpassFrequencies,
      gains: trackGains,
      pans: trackPans,
      bypasses: trackBypasses,
      gainNodes: gainNodes,
      panNodes: panNodes,
      highpassNodes: highpassNodes,
      lowpassNodes: lowpassNodes,
    }),
    [
      trackFrequencies,
      trackHighpassFrequencies,
      trackGains,
      trackPans,
      trackBypasses,
      gainNodes,
      panNodes,
      highpassNodes,
      lowpassNodes,
    ]
  );

  return {
    trackAudioState,
    setTrackFrequencies,
    setTrackHighpassFrequencies,
    setTrackGains,
    setTrackPans,
    setTrackBypasses,
    gainNodes,
    panNodes,
    highpassNodes,
    lowpassNodes,
  };
}
