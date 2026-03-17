# Project Context: PhotoVerify (Picture_Copyright)

## Foundational Mandates
- **Build Definition:** A "build" request ALWAYS means generating a final APK file in the `android` directory.
- **APK Naming:** Follow the pattern `PhotoVerify-v[Version]-[Codename]-[BuildType].apk`.
- **Versioning:** Always increment `versionName` in `android/app/build.gradle` and `src/version.json` before a build.
- **Over en uit:** Commando voor Finale Synchronisatie (Logs, Versions, Git, Build).

## Technical Environment
- **Java Runtime:** Use Java 21 from Homebrew.
- **JAVA_HOME:** `/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- **Build Command:** `export JAVA_HOME=[PATH] && export PATH=$JAVA_HOME/bin:$PATH && ./gradlew assembleDebug` (run in `android/` folder).
- **Validation:** Every build MUST be verified via `python3 scripts/validate_repo.py` (integrated in `npm run build`).

## Technical Findings & Fixes
- **Storage (SAF):** Fixed `EACCESS` errors on Android 11+ by implementing a custom Java Native Bridge for the Storage Access Framework (ACTION_OPEN_DOCUMENT_TREE). Users now select a target folder on first run.
- **Physical Border Stamping:** 
    - **Order:** The visual 1-pixel border MUST be drawn BEFORE extracting proofs to ensure the verifier finds a match in the certified image.
    - **Logic:** The 'interior' image is exactly 2 pixels smaller than the 'original'. During reconstruction, the interior MUST be drawn at `(1, 1)` to align.
- **Forensic Audit:** `ZipVerifier.tsx` uses a 2% noise tolerance to account for intentional visual stamps and browser rendering variance. It intelligently handles optional layers (status: NOT_PRESENT).

## Core Repositories
- **Source of Truth:** `PHOTOVERIFY_REPO.json` maps functional requirements to technical implementations.
- **Build Protocol:** `BUILD_PROTOCOL.md` defines the mandatory validation steps.
