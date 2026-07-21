import * as Tone from "tone";
import type { Genre } from "@/lib/types";
import type { BeatComposition } from "./generator";
import { noteToFrequency } from "./theory";
import { getGenreProfile } from "./patterns";

type BasicOscType = "sine" | "square" | "sawtooth" | "triangle";

interface GenreTimbre {
  bassOsc: BasicOscType;
  chordOsc: BasicOscType;
  hookOsc: BasicOscType;
  filterCutoff: number;
}

const GENRE_TIMBRE: Record<Genre, GenreTimbre> = {
  trap: { bassOsc: "sine", chordOsc: "sawtooth", hookOsc: "triangle", filterCutoff: 1200 },
  drill: { bassOsc: "sine", chordOsc: "sawtooth", hookOsc: "triangle", filterCutoff: 1000 },
  "boom-bap": { bassOsc: "triangle", chordOsc: "triangle", hookOsc: "sine", filterCutoff: 1800 },
  lofi: { bassOsc: "triangle", chordOsc: "sine", hookOsc: "sine", filterCutoff: 900 },
  rnb: { bassOsc: "sine", chordOsc: "sine", hookOsc: "triangle", filterCutoff: 1600 },
  pop: { bassOsc: "sawtooth", chordOsc: "sawtooth", hookOsc: "square", filterCutoff: 2200 },
  afrobeats: { bassOsc: "sine", chordOsc: "triangle", hookOsc: "triangle", filterCutoff: 2000 },
  house: { bassOsc: "sawtooth", chordOsc: "sawtooth", hookOsc: "square", filterCutoff: 2400 },
};

function buildInstrumentRack(destination: Tone.ToneAudioNode, genre: Genre) {
  const timbre = GENRE_TIMBRE[genre];

  const masterFilter = new Tone.Filter(timbre.filterCutoff, "lowpass").connect(destination);

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.045,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.4 },
  }).connect(masterFilter);
  kick.volume.value = -2;

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).connect(masterFilter);
  snare.volume.value = -6;

  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
  }).connect(masterFilter);
  hat.volume.value = -16;

  const openHat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.22, sustain: 0 },
  }).connect(masterFilter);
  openHat.volume.value = -18;

  const perc = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.12, release: 0.05 },
    harmonicity: 5.1,
    resonance: 2000,
  }).connect(masterFilter);
  perc.volume.value = -22;

  const bass = new Tone.MonoSynth({
    oscillator: { type: timbre.bassOsc },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 100, octaves: 3 },
  }).connect(masterFilter);
  bass.volume.value = -8;

  const chords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: timbre.chordOsc },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
  }).connect(masterFilter);
  chords.volume.value = -18;

  const hook = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: timbre.hookOsc },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
  }).connect(masterFilter);
  hook.volume.value = -14;

  return { kick, snare, hat, openHat, perc, bass, chords, hook, masterFilter };
}

function stepSeconds(bpm: number, resolution: number): number {
  const quarterNote = 60 / bpm;
  return quarterNote / (resolution / 4);
}

function scheduleComposition(
  composition: BeatComposition,
  rack: ReturnType<typeof buildInstrumentRack>,
  startOffset = 0,
) {
  const { spec, drumBars, bassPerBar, hookPerBar, chordsPerBar } = composition;
  const profile = getGenreProfile(spec.genre);
  const stepDur = stepSeconds(spec.bpm, profile.resolution);
  const barDur = stepDur * profile.resolution;

  drumBars.forEach((bar, barIndex) => {
    const barStart = startOffset + barIndex * barDur;
    bar.kick.forEach((hit) => rack.kick.triggerAttackRelease("C1", "8n", barStart + hit.step * stepDur, hit.velocity));
    bar.snare.forEach((hit) => rack.snare.triggerAttackRelease("16n", barStart + hit.step * stepDur, hit.velocity));
    bar.hat.forEach((hit) => rack.hat.triggerAttackRelease("32n", barStart + hit.step * stepDur, hit.velocity));
    bar.openHat.forEach((hit) => rack.openHat.triggerAttackRelease("8n", barStart + hit.step * stepDur, hit.velocity));
    bar.perc.forEach((hit) => rack.perc.triggerAttackRelease("C4", "32n", barStart + hit.step * stepDur, hit.velocity));
  });

  bassPerBar.forEach((notes, barIndex) => {
    const barStart = startOffset + barIndex * barDur;
    notes.forEach((n) => {
      const freq = noteToFrequency(n.note, n.octave);
      rack.bass.triggerAttackRelease(freq, n.durationSteps * stepDur, barStart + n.step * stepDur, n.velocity);
    });
  });

  chordsPerBar.forEach((chord, barIndex) => {
    const barStart = startOffset + barIndex * barDur;
    const freqs = chord.notes.map((n) => noteToFrequency(n.note, n.octave));
    rack.chords.triggerAttackRelease(freqs, barDur * 0.95, barStart, 0.55);
  });

  hookPerBar.forEach((notes, barIndex) => {
    const barStart = startOffset + barIndex * barDur;
    notes.forEach((n) => {
      const freq = noteToFrequency(n.note, n.octave);
      rack.hook.triggerAttackRelease(freq, n.durationSteps * stepDur, barStart + n.step * stepDur, n.velocity);
    });
  });
}

export function beatDurationSeconds(composition: BeatComposition): number {
  const profile = getGenreProfile(composition.spec.genre);
  const stepDur = stepSeconds(composition.spec.bpm, profile.resolution);
  return stepDur * profile.resolution * composition.spec.bars;
}

/**
 * Renders a generated beat to a plain AudioBuffer using an offline render,
 * which happens much faster than real time. The resulting buffer can be
 * treated exactly like an uploaded beat file everywhere else in the app.
 */
export async function renderBeatToAudioBuffer(composition: BeatComposition, loops = 1): Promise<AudioBuffer> {
  const singleLoopDuration = beatDurationSeconds(composition);
  const duration = singleLoopDuration * loops + 0.5;

  const toneBuffer = await Tone.Offline((context) => {
    const rack = buildInstrumentRack(context.destination, composition.spec.genre);
    for (let i = 0; i < loops; i++) {
      scheduleComposition(composition, rack, i * singleLoopDuration);
    }
  }, duration);

  const audioBuffer = toneBuffer.get();
  if (!audioBuffer) {
    throw new Error("Failed to render beat audio.");
  }
  return audioBuffer;
}
