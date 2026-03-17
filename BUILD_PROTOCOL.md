# PhotoVerify Build & Validation Protocol

## 1. Principle: Functional-Technical Mapping
Every build of PhotoVerify must be explicitly verified against the `PHOTOVERIFY_REPO.json`. This repository serves as the **Source of Truth**, mapping functional requirements to their technical implementations.

## 2. Mandatory Validation
The build process (`npm run build`) is strictly dependent on the `npm run validate` step. This step:
1.  Loads the current `PHOTOVERIFY_REPO.json`.
2.  Iterates through all core technical components defined in the repo.
3.  Verifies the presence and integrity of these components in the filesystem.
4.  **Aborts the build** if any core component is missing or misaligned.

## 3. Core Components Monitored
The validation script (`scripts/validate_repo.py`) monitors:
- **UI Screens:** App.tsx, About/Info modes.
- **Forensic Layers:** virtualStorage.ts, perceptualHash.ts, LegacyBorderVerifier.tsx, timeAnchor.ts.
- **Bundle Logic:** ZipVerifier.tsx, zipper.ts.
- **System Bridges:** MainActivity.java, NativeBridgePlugin.java (SAF Integration).
- **Security:** license.ts.

## 4. Maintenance
Whenever a new functional feature is added or a technical module is refactored, the `PHOTOVERIFY_REPO.json` **MUST** be updated first. The build will fail until the technical mapping reflects the actual codebase structure.
