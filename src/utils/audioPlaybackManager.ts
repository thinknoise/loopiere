// utils/audioPlaybackManager.ts
import { prepareAllTracks, SampleDescriptor } from "./audioManager";
import { resumeAudioContext } from "./audioContextSetup";
import { PlaybackSample } from "../hooks/useAudioPlayback";
import { TrackInfo } from "../components/TrackList";

interface StartPlaybackArgs {
  allSamples: SampleDescriptor[];
  tracks: TrackInfo[]; // replace with your actual TrackInfo[] type
  bpm: number;
  getPlacedSamples: () => PlaybackSample[];
  playNow: (samples: PlaybackSample[], bpm: number) => void;
  stop: () => void;
  stopAll: () => void;
  start: () => void;
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
}: StartPlaybackArgs) {
  stop();
  stopAll();
  await prepareAllTracks(allSamples, tracks);
  resumeAudioContext();
  const placed = getPlacedSamples();
  await prepareAllTracks(placed, tracks);
  start();
  playNow(placed, bpm);
}

interface StopPlaybackArgs {
  stop: () => void;
  stopAll: () => void;
}

export function stopPlayback({ stop, stopAll }: StopPlaybackArgs) {
  stop();
  stopAll();
}
