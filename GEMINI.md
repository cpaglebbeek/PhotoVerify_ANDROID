# Gemini CLI Project Mandates - PhotoVerify

## General Principles
- **Over en uit:** When the user says "over en uit", the agent must perform a "Final Synchronization" routine:
  1. Record all session findings, bug fixes, and significant architectural changes in `GEMINI.md`.
  2. Update `versions.json` with a summary of the work.
  3. Ensure all changes are committed (after reviewing with the user).
  4. Build the latest APK if requested or relevant.

## Technical Findings
- **Physical Border Mismatch (Fixed 2026-03-16):**
  - **Issue:** The visual 1-pixel border stamp was being applied to the "original" image *after* the border and interior proofs were extracted. This caused a mismatch during the Forensic Audit (Zip Verification) because the reconstructed image (from proofs) lacked the stamp present in the "original".
  - **Fix:** Applied the visual stamp to the canvas *before* extracting the proofs in `CopyrightCreator.tsx`.
  - **Improvement:** `ZipVerifier.tsx` now supports both legacy (full-sized) and v1.0.5+ (cropped) interior proofs and is more flexible with file naming (`_protected_interior.png` vs `_cropped_interior.png`).

## Build Configuration
- **Vite:** Requires `index.html` and `tsconfig.app.json` in the root.
- **Capacitor:** Requires `capacitor.config.json` in the root to find the `dist` directory.
- **Environment:** Java 21 is required for Gradle builds (`JAVA_HOME` set to `/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`).
