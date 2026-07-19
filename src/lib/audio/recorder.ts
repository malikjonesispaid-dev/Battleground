import { getAudioContext } from "./context";

export interface RecorderHandle {
  stop: () => Promise<Blob>;
  cancel: () => void;
  analyser: AnalyserNode;
}

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Opens the mic and starts recording. Also runs a light cleanup chain
 * (high-pass filter to cut rumble + a gentle noise gate via dynamics
 * compressor) so raw vocal takes are already close to broadcast-ready.
 */
export async function startVocalRecording(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  const ctx = getAudioContext();
  const source = ctx.createMediaStreamSource(stream);

  const highPass = ctx.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 80;

  const gate = ctx.createDynamicsCompressor();
  gate.threshold.value = -50;
  gate.knee.value = 6;
  gate.ratio.value = 12;
  gate.attack.value = 0.003;
  gate.release.value = 0.15;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;

  const destination = ctx.createMediaStreamDestination();

  source.connect(highPass);
  highPass.connect(gate);
  gate.connect(analyser);
  analyser.connect(destination);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(destination.stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopAllTracks = () => {
    stream.getTracks().forEach((track) => track.stop());
    source.disconnect();
    highPass.disconnect();
    gate.disconnect();
    analyser.disconnect();
  };

  recorder.start(100);

  return {
    analyser,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          stopAllTracks();
          resolve(new Blob(chunks, { type: mimeType ?? "audio/webm" }));
        };
        recorder.stop();
      }),
    cancel: () => {
      try {
        recorder.stop();
      } catch {
        // already stopped
      }
      stopAllTracks();
    },
  };
}
