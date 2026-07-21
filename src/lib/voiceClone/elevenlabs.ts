/**
 * Thin client for the ElevenLabs REST API (voice cloning + speech-to-speech
 * voice conversion). Calls go directly from the browser to ElevenLabs using
 * a user-supplied API key - nothing is proxied through any server we run.
 *
 * This talks to a real third-party paid API. It has NOT been exercised
 * against a live account from this codebase (the dev sandbox that built it
 * has no network access to elevenlabs.io) - the request shapes below match
 * ElevenLabs' documented REST API, but if endpoints or field names have
 * shifted since, error messages from `request()` should make that visible
 * quickly (rather than failing silently).
 */

const API_BASE = "https://api.elevenlabs.io";

export interface ClonedVoice {
  voiceId: string;
  name: string;
  previewUrl?: string;
}

export class ElevenLabsError extends Error {}

async function request(path: string, apiKey: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "xi-api-key": apiKey, ...(init.headers ?? {}) },
    });
  } catch {
    throw new ElevenLabsError(
      "Couldn't reach ElevenLabs. Check your connection - if this keeps happening, ElevenLabs' API may not allow direct browser requests from this domain and you'd need a small relay server instead.",
    );
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail?.message ?? body?.detail ?? JSON.stringify(body);
    } catch {
      // response wasn't JSON - fall back to statusText
    }
    if (res.status === 401) {
      throw new ElevenLabsError("ElevenLabs rejected that API key.");
    }
    if (res.status === 429) {
      throw new ElevenLabsError("ElevenLabs rate-limited this request - wait a moment and try again.");
    }
    throw new ElevenLabsError(`ElevenLabs error (${res.status}): ${detail}`);
  }

  return res;
}

export async function listVoices(apiKey: string): Promise<ClonedVoice[]> {
  const res = await request("/v1/voices", apiKey, { method: "GET" });
  const data = await res.json();
  const voices = Array.isArray(data.voices) ? data.voices : [];
  return voices.map((v: { voice_id: string; name: string; preview_url?: string }) => ({
    voiceId: v.voice_id,
    name: v.name,
    previewUrl: v.preview_url,
  }));
}

export async function cloneVoice(apiKey: string, name: string, sample: Blob): Promise<ClonedVoice> {
  const form = new FormData();
  form.append("name", name);
  form.append("files", sample, "sample.wav");

  const res = await request("/v1/voices/add", apiKey, { method: "POST", body: form });
  const data = await res.json();
  return { voiceId: data.voice_id, name };
}

export async function deleteVoice(apiKey: string, voiceId: string): Promise<void> {
  await request(`/v1/voices/${voiceId}`, apiKey, { method: "DELETE" });
}

/** Speech-to-speech: re-performs the input audio in the target cloned voice. */
export async function convertToVoice(apiKey: string, voiceId: string, source: Blob): Promise<Blob> {
  const form = new FormData();
  form.append("audio", source, "source.wav");
  form.append("model_id", "eleven_multilingual_sts_v2");

  const res = await request(`/v1/speech-to-speech/${voiceId}`, apiKey, { method: "POST", body: form });
  return res.blob();
}
