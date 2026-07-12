# Pocket Pentest Kit

An Android app for testing systems **you own or are explicitly authorized to
test**: your own network, your own accounts/password hashes, and your own web
applications. Every tool sends real requests/connections — there is no
simulated or canned output anywhere in this codebase.

This app requires an explicit scope acknowledgement on first launch, and a
per-tool "I own this target / am authorized" checkbox before any scan can be
started. Read [LEGAL.md](LEGAL.md) before using it.

## Tools

- **Network Scanner** (`scanner/`) — real TCP-connect host discovery and port
  scan across a single host or a CIDR range you provide (capped at 1024 hosts
  per run to keep scans bounded on a phone).
- **Password Auditor** (`password/`)
  - *Hash Cracker* — dictionary attack (MD5/SHA-1/SHA-256/SHA-512) against a
    hash you provide, using a bundled ~1,500-entry common-password wordlist or
    your own wordlist file.
  - *Login Brute Force* — sequential HTTP POST attempts against a login form
    URL you provide, with a mandatory delay between attempts and a
    user-defined "failure marker" string to detect success vs. failure.
- **SQLi Tester** (`sqli/`) — error-based (DB error signature matching),
  boolean-based (differential response comparison), and time-based
  (response-delay) SQL injection probes against a URL with query parameters.

## Building

This repo has no committed Gradle wrapper because the sandbox this project
was built in has no outbound access to `services.gradle.org`. Two ways to
build:

1. **CI (recommended)** — `.github/workflows/build-apk.yml` installs the
   Android SDK and Gradle 8.7 and builds a debug APK on every push; download
   it from the workflow run's Artifacts.
2. **Locally** — open the project root in Android Studio (it will offer to
   generate the Gradle wrapper for you), or install Gradle 8.7+ and run:

   ```
   gradle assembleDebug
   ```

   The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## Project layout

```
app/src/main/java/com/battleground/pentestkit/
  core/       DisclaimerActivity (scope acknowledgement gate)
  scanner/    NetworkScanner engine + NetworkScanActivity UI
  password/   HashCracker, HttpLoginBruteForcer engines + PasswordAuditActivity UI
  sqli/       SqliScanner engine + SqliTesterActivity UI
app/src/main/assets/wordlists/common-passwords.txt   bundled dictionary
```
