// src/components/Track.tsx

import React, { forwardRef, Ref, DragEvent, FC } from "react";
import type { TrackSampleType, BaseSample } from "../types/audio";
import TrackSample from "./TrackSample";
import { TrackInfo } from "./TrackList";
import { useTrackSampleStore } from "../stores/trackSampleStore";
import { getSampleFromRegistry } from "../utils/sampleRegistry";
import { useAudioContext } from "./AudioContextProvider";
import { useTrackAudioStateContext } from "../context/TrackAudioStateContext";

import Knob from "./TrackControls/knob";
import faderIcon from "../assets/faderIcon.svg";
import { useLoopSettings } from "../context/LoopSettingsContext";
import "../style/track.css";

export interface TrackProps {
  trackInfo: TrackInfo;
  trackWidth: number;
  trackLeft: number;
  selected: boolean;
  onSelect: () => void;
}

// Utility: convert any sample to a track sample
function promoteToTrackSample(
  sample: BaseSample,
  overrides: Partial<Pick<TrackSampleType, "trackId" | "xPos" | "onTrack">>
): TrackSampleType {
  const base: TrackSampleType = {
    ...sample,
    id: Date.now() + Math.floor(Math.random() * 100000), // Ensure uniqueness
    trackId: overrides.trackId ?? 0,
    xPos: overrides.xPos ?? 0,
    onTrack: overrides.onTrack ?? false,
  } as TrackSampleType;
  return base;
}

const Track: FC<
  Omit<TrackProps, "allSamples"> & { ref?: Ref<HTMLDivElement> }
> = forwardRef<HTMLDivElement, TrackProps>(
  (
    {
      trackInfo,
      trackWidth,
      trackLeft,
      selected,
      onSelect = () => {
        console.warn("Track onSelect not implemented");
      },
    },
    ref
  ) => {
    const audioContext = useAudioContext();
    const { beatsPerLoop } = useLoopSettings();
    const allSamples = useTrackSampleStore((s) => s.allSamples);
    const trackSamples = allSamples.filter((s) => s.trackId === trackInfo.id);

    const {
      trackAudioState: {
        filters: trackFiltersRef,
        frequencies: trackFrequencies,
        highpassFrequencies,
        gains: trackGains,
        pans: trackPans,
        bypasses,
        sampleRates: sampleRates,
      },
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
    } = useTrackAudioStateContext();

    const toggleBypass = (type: "lowpass" | "highpass") => {
      setTrackBypasses((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [trackInfo.id]: !prev[type][trackInfo.id],
        },
      }));
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const { id: sampleId, xDragOffset } = JSON.parse(data);
        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = Math.max(0, e.clientX - rect.left - xDragOffset);
        const xPos = dropX / trackWidth;

        console.log(
          `Dropping sample ${sampleId} at xPos ${xPos} on track ${trackInfo.id}`
        );
        const original = getSampleFromRegistry(sampleId);
        if (!original) return;
        console.log("Original sample:", original);
        const trackSample = promoteToTrackSample(original, {
          trackId: trackInfo.id,
          xPos,
          onTrack: true,
        });

        const prev = useTrackSampleStore.getState().allSamples;
        useTrackSampleStore.getState().setAllSamples([...prev, trackSample]);
      } catch (err) {
        console.warn("❌ Failed to parse drag data:", err);
      }
    };

    return (
      <div className="track-container">
        <div className="track-row">
          <button
            className="track-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <img
              src={faderIcon}
              alt="Toggle Track"
              className={`track-toggle-icon ${selected ? "active" : ""}`}
            />
          </button>

          <div
            ref={ref}
            className={`track drop-zone ${selected ? "track--selected" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <span className="track-name">{trackInfo.name}</span>
            {Array.from({ length: beatsPerLoop - 1 }).map((_, i) => (
              <div
                key={i}
                className="beat-line"
                style={{ left: `${((i + 1) / beatsPerLoop) * 100}%` }}
              />
            ))}

            {trackSamples.map((sampleInfo: TrackSampleType) => (
              <TrackSample
                key={sampleInfo.id}
                sample={sampleInfo}
                trackWidth={trackWidth}
                trackLeft={trackLeft}
              />
            ))}
          </div>
        </div>

        <div className={`track-control ${selected ? "expanded" : ""}`}>
          <div className="track-control-panel">
            <div className="control-item slider-strip">
              <div className="control-item knob-strip">
                <Knob
                  value={trackPans[trackInfo.id] ?? 0}
                  onChange={(val) => {
                    setTrackPans((prev) => ({ ...prev, [trackInfo.id]: val }));
                    const panNode = panNodes.current.get(trackInfo.id);
                    panNode?.pan.setValueAtTime(val, audioContext.currentTime);
                  }}
                  size={20}
                />
              </div>

              <input
                type="range"
                id={`gain-${trackInfo.id}`}
                min="0"
                max="1"
                step="0.01"
                value={trackGains[trackInfo.id] ?? 1}
                className="vertical-slider"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrackGains((prev) => ({ ...prev, [trackInfo.id]: val }));
                  const gainNode = gainNodes.current.get(trackInfo.id);
                  gainNode?.gain.setValueAtTime(val, audioContext.currentTime);
                }}
              />
              <label htmlFor={`gain-${trackInfo.id}`}>vol</label>
            </div>

            <div className="control-item slider-strip">
              <button
                className="bypass-toggle"
                onClick={() => toggleBypass("lowpass")}
              >
                {bypasses.lowpass[trackInfo.id] ? "x" : "o"}
              </button>
              <input
                type="range"
                id={`lowpass-${trackInfo.id}`}
                min="80"
                max="5000"
                step="10"
                value={trackFrequencies[trackInfo.id] ?? 400}
                className="vertical-slider"
                onChange={(e) => {
                  const freq = parseFloat(e.target.value);
                  setTrackFrequencies((prev) => ({
                    ...prev,
                    [trackInfo.id]: freq,
                  }));
                  const lowpassNode = lowpassNodes.current.get(trackInfo.id);
                  if (!bypasses.lowpass[trackInfo.id]) {
                    lowpassNode?.frequency.setValueAtTime(
                      freq,
                      audioContext.currentTime
                    );
                  }
                }}
                disabled={bypasses.lowpass[trackInfo.id]}
              />
              <label htmlFor={`lowpass-${trackInfo.id}`}>low</label>
            </div>

            <div className="control-item slider-strip">
              <button
                className="bypass-toggle"
                onClick={() => toggleBypass("highpass")}
              >
                {bypasses.highpass[trackInfo.id] ? "x" : "o"}
              </button>
              <input
                type="range"
                id={`highpass-${trackInfo.id}`}
                min="80"
                max="5000"
                step="10"
                value={highpassFrequencies[trackInfo.id] ?? 400}
                className="vertical-slider"
                onChange={(e) => {
                  const freq = parseFloat(e.target.value);
                  setTrackHighpassFrequencies((prev) => ({
                    ...prev,
                    [trackInfo.id]: freq,
                  }));
                  const highpassNode = highpassNodes.current.get(trackInfo.id);
                  if (!bypasses.highpass[trackInfo.id]) {
                    highpassNode?.frequency.setValueAtTime(
                      freq,
                      audioContext.currentTime
                    );
                  }
                }}
                disabled={bypasses.highpass[trackInfo.id]}
              />
              <label htmlFor={`highpass-${trackInfo.id}`}>high</label>
            </div>

            <div className="control-item slider-strip">
              <span className="value-display">
                {sampleRates[trackInfo.id]?.toFixed(2) ?? "1.00"}×
              </span>

              <input
                type="range"
                id={`sample-rate-${trackInfo.id}`}
                min="0.33"
                max="2"
                step="0.0595"
                value={sampleRates[trackInfo.id] ?? 1}
                className="vertical-slider"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrackSampleRates((prev) => ({
                    ...prev,
                    [trackInfo.id]: val,
                  }));
                  const sampleRateNode = sampleRateNodes.current.get(
                    trackInfo.id
                  );
                  // sampleRateNode?.setValueAtTime(val);
                }}
              />
              <label htmlFor={`sample-rate-${trackInfo.id}`}>rate</label>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Track;
