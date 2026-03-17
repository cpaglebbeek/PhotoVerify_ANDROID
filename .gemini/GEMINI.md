# Project Context: PhotoVerify (Picture_Copyright)

## Foundational Mandates
- **Build Definition:** A "build" request ALWAYS means generating a final APK file in the `android` directory.
- **APK Naming:** Follow the pattern `PhotoVerify-v[Version]-[Codename]-[BuildType].apk`.
- **Versioning:** Always increment `versionName` in `android/app/build.gradle` and `src/version.json` before a build.

## Technical Environment
- **Java Runtime:** Use Java 21 from Homebrew.
- **JAVA_HOME:** `/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- **Build Command:** `export JAVA_HOME=[PATH] && export PATH=$JAVA_HOME/bin:$PATH && ./gradlew assembleDebug` (run in `android/` folder).

## Core Logic Principles
- **Physical Border:** The 'interior' image is exactly 2 pixels smaller than the 'original'. During verification/reconstruction, the interior MUST be drawn at `(1, 1)` to align.
- **Storage:** Never store large Base64 strings in `localStorage`. Use `src/utils/history.ts` without the `dataUrl` field.
- **Config URLs:** Default remote configurations are hosted at `https://fotolerant.nl/config/`.
