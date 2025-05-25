// utils/audioPlaybackManager.ts
import { prepareAllTracks, SampleDescriptor } from "./audioManager";
import { resumeAudioContext } from "./audioContextSetup";
import { PlaybackSample, TrackAudioState } from "../hooks/useAudioPlayback";
import { TrackInfo } from "../components/TrackList";

interface StartPlaybackArgs {
  allSamples: SampleDescriptor[];
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
  await prepareAllTracks(placed, tracks);
  start();

  playNow(placed, bpm, trackAudioState);
}

interface StopPlaybackArgs {
  stop: () => void;
  stopAll: () => void;
}

export function stopPlayback({ stop, stopAll }: StopPlaybackArgs) {
  stop();
  stopAll();
}
