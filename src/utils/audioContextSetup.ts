// src/utils/audioContextSetup.ts

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (ctx === null) {
    // Handle both standard and prefixed AudioContext constructors
    const AudioCtxCtor =
      window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AudioCtxCtor();
  }
  return ctx;
}

export function resumeAudioContext(): void {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}
