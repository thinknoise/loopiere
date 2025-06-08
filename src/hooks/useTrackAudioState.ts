import { useRef, useState, useEffect, useMemo } from "react";

export function useTrackAudioState(trackNumber: number) {
  const gainNodes = useRef<Map<number, GainNode>>(new Map());
  const panNodes = useRef<Map<number, StereoPannerNode>>(new Map());
  const highpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());
  const lowpassNodes = useRef<Map<number, BiquadFilterNode>>(new Map());
  const sampleRateNodes = useRef<Map<number, number>>(new Map());

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

  const [trackSampleRates, setTrackSampleRates] = useState<
    Record<number, number>
  >({});

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
      sampleRates: trackSampleRates,
      gainNodes: gainNodes,
      panNodes: panNodes,
      highpassNodes: highpassNodes,
      lowpassNodes: lowpassNodes,
      sampleRateNodes: sampleRateNodes,
    }),
    [
      trackFrequencies,
      trackHighpassFrequencies,
      trackGains,
      trackPans,
      trackBypasses,
      trackSampleRates,
      gainNodes,
      panNodes,
      highpassNodes,
      lowpassNodes,
      sampleRateNodes,
    ]
  );

  return {
    trackAudioState,
    setTrackFrequencies,
    setTrackHighpassFrequencies,
    setTrackGains,
    setTrackPans,
    setTrackBypasses,
    setTrackSampleRates,
    gainNodes,
    panNodes,
    highpassNodes,
    lowpassNodes,
    sampleRateNodes,
  };
}
