# Loopiere

## On the web

https://modelglue.com/loopiere/

This is a simple looper with simple samples. 

Loopiere is an interactive web-based looper built with the Web Audio API. It lets you drag and drop audio samples into multiple tracks, arrange them along a timeline based on tempo, and create seamless loops entirely in the browser.

## Project Motivation

- **Learn by Building**: The core motivation behind Loopiere is to dive deep into the Web Audio API. By crafting a custom loop arranger from scratch, you’ll gain hands-on experience with AudioContext, BufferSource nodes, precise scheduling, and real-time audio manipulation.
- **Precision Timing & Scheduling**: Loopiere leverages the Web Audio API’s high-resolution clock (`AudioContext.currentTime`) to implement sample-accurate scheduling. Each loop iteration instantiates a new buffer source node with `audioContext.createBufferSource()`, then uses `.start(when)` and `.stop(when)` to precisely control playback timing—ensuring perfect sync. ([developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime?utm_source=chatgpt.com), [web.dev](https://web.dev/articles/audio-scheduling?utm_source=chatgpt.com))
- **Creative Playground**: Beyond the technical exploration, Loopiere provides a fun sandbox for experimentation. Load up different samples, tweak their positions, and hear your loop come to life instantly—no need for heavy-duty DAWs.
- **UI & UX Exploration**: Building an intuitive drag-and-drop interface for audio samples challenges you to think about timing, feedback, and responsiveness, bridging the gap between code and user experience.

> While robust web-based audio tools already exist, Loopiere isn’t about recreating a full-fledged DAW. It’s about understanding how Web Audio works under the hood—and having a blast playing with samples along the way.

## Core Concepts Explored

- **AudioContext & Buffer Loading**
- **Playback Scheduling & Tempo Management**
- **Drag-and-Drop Sample Placement**
- **Looping & Synchronization**
- **Track Filters & Effects**: Each track can later integrate filter nodes (e.g., `BiquadFilterNode`) to apply real-time EQ or creative filtering effects to individual samples, enhancing the sonic palette.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/loopiere.git
   ```
2. **Install dependencies**
   ```bash
   cd loopiere
   npm install
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

Be a Loopiere
