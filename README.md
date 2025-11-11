# Loopiere
DEPLOYED VERSION

## On the web
https://modelglue.com/loopiere/

Loopiere is a small React + Web Audio looper I built as a way to explore sequencing, shared state, and timing logic without getting lost in a giant audio framework.

Live demo: https://modelglue.com/loopiere/

## Available Scripts

In the project directory, you can run:

### `npm start`
Open http://localhost:3000 to view it in your browser.

### `npm test`
Runs the test suite.

### `npm run build`
Builds the app for production.

---

## Things to look at...

- **src/context/SequenceContext.tsx** — shared state/actions (BPM, allSamples updates, save/share, re-positioning).  
- **src/components/TrackList.tsx** — how tracks render and how state flows through the UI.  
- **src/components/Controls.tsx** — controlled inputs, timing updates, simple debouncing.  
- **src/hooks/useKeyboardShortcuts.ts** — tiny custom hook for quick interactions.  
- **src/utils/scheduling/** — the timing/scheduling helpers that keep playback predictable.  

---
Be a Loopiere
