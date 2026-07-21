# Voice Studio

A browser-based, AI-assisted music studio: write your own lyrics, generate a beat, record vocals over it, and master the final track — no installs, no server, no external API keys required.

## Features

- **AI Beat Engine** (`src/lib/beatgen`) — a real generative composer, not a static sample library. Picks a chord progression, builds genre-appropriate drum patterns, a bassline, and (for some genres) a synth hook, then renders it with Tone.js instruments. Same genre/BPM/key/seed always reproduces the same beat, so a project only needs to store the tiny spec, not the audio, to be reopened later. You can also upload your own beat file instead.
- **Multitrack vocal recording** (`src/lib/audio`) — records from the mic with a light cleanup chain (high-pass + noise gate), lets you stack unlimited takes over the beat, and mix each with gain/pan/mute/solo/reverb send.
- **AI Pitch Assist** — optional per-track pitch correction that detects each vocal frame's pitch and nudges it toward the beat's key/scale, blended by strength.
- **AI Mastering Chain** (`src/lib/mastering`) — auto EQ, saturation/warmth, dual-band "glue" compression, mid/side stereo widening, LUFS-targeted auto-gain (two-pass: analyze, then apply), and a limiter. Five starting presets, fully adjustable.
- **Lyrics + teleprompter** — write bars, then switch to a large-text auto-scrolling view paced to the track length.
- **Local persistence** — projects (including recorded takes and uploaded beats) are saved to IndexedDB in the browser; nothing is uploaded anywhere.
- **WAV export** — export the mastered master or the raw unmastered mix.

Everything runs client-side via the Web Audio API. There's no backend, no accounts, and no telemetry.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Open Studio**. Recording requires microphone permission and a user gesture (click) before audio can start, per browser autoplay rules.

## Project structure

```
src/lib/audio/       recording, playback engine, mixdown, WAV encode, pitch correction
src/lib/beatgen/      music theory, drum pattern generator, beat composer, Tone.js renderer
src/lib/mastering/    mastering DSP chain, loudness analysis, presets
src/lib/storage/      IndexedDB project + audio blob persistence
src/store/            zustand store for studio state
src/hooks/            useStudioEngine - wires store + audio engine + storage together
src/components/studio/ UI: beat library, track list, lyrics/teleprompter, mastering panel, transport
```

## Extending with external AI services

The beat engine and mastering chain are fully self-contained (no API keys needed) so the app works offline out of the box. If you want to swap in a hosted generative-music model (e.g. for more varied/realistic instrumentals) or a cloud mastering API, the natural integration points are `src/hooks/useStudioEngine.ts`'s `generateBeat`/`runMastering` — swap the local call for a `fetch` to your provider and decode the returned audio the same way `uploadBeat` does.
