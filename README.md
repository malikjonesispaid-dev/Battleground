# J.A.R.V.I.S. for Android

A futuristic, HUD-styled voice assistant for Android built with Kotlin and Jetpack Compose — an animated arc-reactor core, radar-sweep background, voice input/output, and a Claude-powered brain.

## Features

- Animated sci-fi HUD: pulsing reactor core, radar sweep, HUD grid, state-reactive glow (idle / listening / thinking / speaking)
- Voice in (`SpeechRecognizer`) and voice out (`TextToSpeech`)
- Offline commands that work with no API key: time, date, battery, flashlight, camera, web search, system diagnostics
- Optional Claude API integration (bring your own key) for open-ended conversation — choose Opus, Sonnet, or Haiku in Settings
- API key stored with `EncryptedSharedPreferences` (Android Keystore-backed), never leaves the device except directly to `api.anthropic.com`

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

## Adding your API key

Open the app → Settings (gear icon) → paste an Anthropic API key from console.anthropic.com. Without a key, the offline commands above still work.
