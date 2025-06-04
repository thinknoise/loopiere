// utils/audioPlaybackManager.ts
import { prepareAllTracks } from "./audioManager";
import { resumeAudioContext } from "./audioContextSetup";
import { PlaybackSample, TrackAudioState } from "../hooks/useAudioPlayback";
import { TrackInfo } from "../components/TrackList";
import type { TrackSample } from "../types/audio";

interface StartPlaybackArgs {
  allSamples: TrackSample[];
  tracks: TrackInfo[]; // replace with your actual TrackInfo[] type
  bpm: number;
  getPlacedSamples: () => PlaybackSample[];
  playNow(
    samples: PlaybackSample[],
    bpm: number,
    trackAudioState: TrackAudioState
  ): Promise<void>;
  stop: () => void;
  stopAll: () => void;
  start: () => void;
  trackAudioState: TrackAudioState;
}

export async function startPlayback({
  allSamples,
  tracks,
  bpm,
  getPlacedSamples,
  playNow,
  stop,
  stopAll,
  start,
  trackAudioState,
}: StartPlaybackArgs) {
  stop();
  stopAll();
  await prepareAllTracks(allSamples, tracks);
  resumeAudioContext();
  const placed = getPlacedSamples();
  console.log("Placed samples:", placed);
  if (placed.length === 0) {
    console.warn("No samples to play — aborting startPlayback.");
    return;
  }

  await prepareAllTracks(placed, tracks);
  start();

  playNow(placed, bpm, trackAudioState);
}

interface StopPlaybackArgs {
  stop: () => void;
  stopAll: () => void;
}

export function stopPlayback({ stop, stopAll }: StopPlaybackArgs) {
  console.log("bing stoperoni");
  stop();
  stopAll();
}
