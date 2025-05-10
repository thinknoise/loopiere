// src/utils/audioContextSetup.js
let ctx = null;
export function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
export function resumeAudioContext() {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}
