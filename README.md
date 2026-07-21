# Gordo Loops

A browser-based, AI-assisted music studio: write your own lyrics, generate a beat, record vocals over it, and master the final track — no installs, no server required. Voice cloning is the one optional feature that needs an external API key; everything else runs fully offline.

## Features

- **AI Beat Engine** (`src/lib/beatgen`) — a real generative composer, not a static sample library. Picks a chord progression, builds genre-appropriate drum patterns, a bassline, and (for some genres) a synth hook, then renders it with Tone.js instruments. Same genre/BPM/key/seed always reproduces the same beat, so a project only needs to store the tiny spec, not the audio, to be reopened later. You can also upload your own beat file instead.
- **Beat Editor** (`src/lib/beatgen/editing.ts`) — a step-sequencer over the generated pattern, split into editable sections (4 bars each by default): toggle individual kick/snare/hi-hat/open-hat/perc hits, or mute bass/chords/hook, per section. Edits overlay the generated pattern as a small diff rather than baked-in audio.
- **Multitrack vocal recording** (`src/lib/audio`) — records from the mic with a light cleanup chain (high-pass + noise gate), lets you stack up to 10 takes/FX over the beat, and mix each with gain/pan/mute/solo/reverb send. Laid out on a real timeline (`src/components/studio/Timeline.tsx`) with all tracks positioned against a shared time ruler and playhead.
- **AI Pitch Assist** — optional per-track pitch correction that detects each vocal frame's pitch and nudges it toward the beat's key/scale, blended by strength.
- **Vocal Editor Hub** — per-track voice effect presets (Radio, Telephone, Robot, Hall Reverb, Chorus/Doubler, Chipmunk, Deep/Giant) via a shared Web Audio node graph, plus a soundboard of 8 synthesized one-shot FX (air horn, 808 boom, laser, scratch, riser, siren, chime, impact) you can preview and drop into the timeline.
- **Voice cloning** (`src/lib/voiceClone`, optional) — clone your voice from a recorded take and convert takes into a cloned voice via the ElevenLabs API. Bring your own ElevenLabs API key (entered in-app, stored only in your browser's localStorage, calls go straight from your browser to ElevenLabs). This is the one feature that leaves the device and costs money to use; everything else is free and local.
- **AI Mastering Chain** (`src/lib/mastering`) — auto EQ, saturation/warmth, dual-band "glue" compression, mid/side stereo widening, LUFS-targeted auto-gain (two-pass: analyze, then apply), and a limiter. Five starting presets, fully adjustable.
- **Lyrics + teleprompter** — write bars, then switch to a large-text auto-scrolling view paced to the track length.
- **Local persistence** — projects (including recorded takes and uploaded beats) are saved to IndexedDB in the browser; nothing is uploaded anywhere except voice-cloning requests, which you opt into explicitly.
- **WAV export** — export the mastered master or the raw unmastered mix.

Everything except voice cloning runs client-side via the Web Audio API with no backend, no accounts, and no telemetry.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Open Studio**. Recording requires microphone permission and a user gesture (click) before audio can start, per browser autoplay rules.

## Project structure

```
src/lib/audio/       recording, playback engine, mixdown, WAV encode, pitch correction, voice effects
src/lib/beatgen/      music theory, drum pattern generator, beat composer, Tone.js renderer, section editing
src/lib/mastering/    mastering DSP chain, loudness analysis, presets
src/lib/voiceClone/   ElevenLabs API client + local API key storage
src/lib/storage/      IndexedDB project + audio blob persistence
src/store/            zustand store for studio state
src/hooks/            useStudioEngine - wires store + audio engine + storage together
src/components/studio/ UI: beat library, beat editor, timeline, vocal editor hub, mastering panel, transport
```

## Extending with external AI services

The beat engine and mastering chain are fully self-contained (no API keys needed) so the app works offline out of the box. If you want to swap in a hosted generative-music model (e.g. for more varied/realistic instrumentals) or a cloud mastering API, the natural integration points are `src/hooks/useStudioEngine.ts`'s `generateBeat`/`runMastering` — swap the local call for a `fetch` to your provider and decode the returned audio the same way `uploadBeat` does. Voice cloning (`src/lib/voiceClone/elevenlabs.ts`) already follows this bring-your-own-key pattern against the ElevenLabs REST API; it was built without live access to that API from the dev environment, so treat it as needing a real-key smoke test before relying on it.
