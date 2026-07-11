let sharedContext: AudioContext | null = null;

/**
 * Returns a single shared AudioContext for the whole app. Browsers require
 * the context to be created/resumed from within a user gesture, so callers
 * should invoke this from a click/keydown handler the first time.
 */
export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext({ latencyHint: "interactive" });
  }
  if (sharedContext.state === "suspended") {
    void sharedContext.resume();
  }
  return sharedContext;
}

export async function decodeAudioFile(file: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  // decodeAudioData detaches the buffer, so this is safe to call once.
  return ctx.decodeAudioData(arrayBuffer.slice(0));
}
