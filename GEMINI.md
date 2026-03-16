# Gemini CLI Project Mandates - PhotoVerify

## Chat & Sessie Historie
- **Chatlog Mandate:** Alle chat-sessies (JSON logs) moeten vanaf nu worden bijgehouden in de map `.gemini/history/`. 
- **Terugwerkende Kracht:** Alle beschikbare logs uit de tijdelijke mappen van dit project zijn bij de start van v1.0.5 gekopieerd naar deze locatie.
- **Sync Protocol:** Bij elke "over en uit" actie moeten de nieuwste logs uit de systeem-temp-map (`/Users/christian/.gemini/tmp/version-1-0-5/chats/`) worden gesynchroniseerd naar `.gemini/history/` binnen het project.

## General Principles
- **Over en uit:** Wanneer de gebruiker "over en uit" zegt, voert de agent een "Finale Synchronisatie" routine uit:
  1. Record alle bevindingen, bugfixes en architecturale wijzigingen in `GEMINI.md`.
  2. Update `versions.json` met een samenvatting van het werk.
  3. Synchroniseer alle chatlogs van deze sessie naar `.gemini/history/`.
  4. Zorg dat alle wijzigingen (inclusief nieuwe logs) zijn gecommit naar Git.
  5. Build de laatste APK indien relevant.

## Technical Findings
- **Physical Border Mismatch (Fixed 2026-03-16):**
  - **Issue:** The visual 1-pixel border stamp was being applied to the "original" image *after* the border and interior proofs were extracted. This caused a mismatch during the Forensic Audit (Zip Verification) because the reconstructed image (from proofs) lacked the stamp present in the "original".
  - **Fix:** Applied the visual stamp to the canvas *before* extracting the proofs in `CopyrightCreator.tsx`.
  - **Improvement:** `ZipVerifier.tsx` now supports both legacy (full-sized) and v1.0.5+ (cropped) interior proofs and is more flexible with file naming (`_protected_interior.png` vs `_cropped_interior.png`).

## Build Configuration
- **Vite:** Requires `index.html` and `tsconfig.app.json` in the root.
- **Capacitor:** Requires `capacitor.config.json` in the root to find the `dist` directory.
- **Environment:** Java 21 is required for Gradle builds (`JAVA_HOME` set to `/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`).
