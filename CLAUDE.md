# ****PHOTOVERIFY_ANDROID****

## Project Mandates
- **Doel:** Native Android variant van het PhotoVerify ecosysteem.
- **Scope:** Native Android forensics via Kotlin/Java + Capacitor bridge.
- **Master Copy:** Georkestreerd door Meta_PhotoVerify.
- **GitHub:** `https://github.com/cpaglebbeek/PhotoVerify_ANDROID.git` (branch: `photoverify-v0.9`)
- **Lokaal pad:** `/Users/christian/Documents/Gemini_Projects/PhotoVerify_ANDROID`

## Java Runtime
- `JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- Altijd instellen bij uitvoeren van `gradlew`.

## Context-Aware Orchestration
- Platform-specifieke wijzigingen hier; core-logica ALTIJD in `Meta_PhotoVerify`.
- Na elke wijziging: automatisch `git commit` + `git push`.
- Elke reactie begint met: `****PHOTOVERIFY_ANDROID****`

## Build Mandate
- `build` = genereren van een APK: `PhotoVerify-v[Version]-[Codename]-[BuildType].apk`
- WhatIf analyse vóór elke build, daarna akkoord vragen.
- Change detection via `git status` vóór build.
- Na succesvolle build → kopieer APK naar `/Users/christian/Downloads`.

## Feature & Bugfix Protocol (Color-Coded)
**Nieuwe Feature:**
- **Groen:** Minor → versie +0.0.1
- **Oranje:** Design impact → versie +0.1.0
- **Rood:** Architectural → versie +1.0.0

**Bugfix:**
- **Groen:** Snel herstel | **Geel:** Logisch niveau | **Rood:** Conceptueel + Security Audit | **Loop:** Nieuwe invalshoek

**Root Cause Analysis (verplicht):** Functioneel + Technisch + Architectonisch niveau.

## Versioning — Thema: Family Guy (facts)
- **GROEN:** +0.0.1 | **ORANJE:** +0.1.0 | **ROOD:** +1.0.0
- Unieke codenaam per build (Family Guy feit).
- Update `version.json`, `package.json`, Gradle build config vóór build/sync.

## Dashboard Update Mandate
Na elke build of versie-verhoging → update `dashboard_info.html` in Meta_PhotoVerify.
