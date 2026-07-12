# J.A.R.V.I.S. for Android

A futuristic, HUD-styled voice assistant for Android built with Kotlin and Jetpack Compose — an animated arc-reactor core, radar-sweep background, voice input/output, and a Claude-powered brain.

## Features

- Animated sci-fi HUD: pulsing reactor core, radar sweep, HUD grid, state-reactive glow (idle / listening / thinking / speaking)
- Voice in (`SpeechRecognizer`) and voice out (`TextToSpeech`)
- Offline commands that work with no setup at all: time, date, battery, flashlight, camera, web search, system diagnostics
- Claude-powered open-ended conversation through a shared backend proxy (see [`server/`](server/)) — no per-user API key needed, choose Opus, Sonnet, or Haiku in Settings
- Advanced option: paste your own Anthropic API key in Settings to bypass the shared server and talk to `api.anthropic.com` directly. Stored with `EncryptedSharedPreferences` (Android Keystore-backed), never leaves the device except directly to Anthropic

## Getting the APK

This repo builds automatically via GitHub Actions on every push (`.github/workflows/build-apk.yml`). After a push:

1. Open the **Actions** tab → the latest **Build Jarvis APK** run.
2. Download the `jarvis-debug-apk` artifact.
3. Unzip it and install `app-debug.apk` on your device (enable "install from unknown sources" for your file manager / browser).

## Building locally

Requires Android Studio (or the Android SDK + JDK 17):

```
./gradlew assembleDebug
```

## Backend proxy (`server/`)

The app talks to a small proxy server that holds one Anthropic API key server-side, so the APK itself never contains a key and no user has to bring one. See [`server/README.md`](server/README.md) to deploy your own instance. Once deployed, either:

- bake the URL (and optional shared secret) into CI builds via the `JARVIS_PROXY_BASE_URL` / `JARVIS_PROXY_SHARED_SECRET` repo secrets used by `.github/workflows/build-apk.yml`, or
- open the app → Settings (gear icon) → paste the server URL/secret manually.

## Bring your own key (advanced, optional)

Open the app → Settings (gear icon) → paste an Anthropic API key from console.anthropic.com under "Anthropic API Key (Advanced)". This bypasses the shared server entirely and talks to Anthropic directly from the device. Without a key or a server configured, the offline commands above still work.
