# Gemini Project Log: Picture Copyright / PhotoVault

## Mandaten
- **Documentatie-plicht:** Alle door de gebruiker verstrekte informatie en beslissingen moeten direct worden verwerkt in de relevante `.md` bestanden of broncode-bestanden om continuïteit tussen sessies te garanderen.
- **Rapportage-plicht:** Bij elke handeling moet Gemini expliciet vermelden welke bestanden zijn aangepast en waarom.
- **Chat-Historie-plicht:** Gemini houdt een letterlijke geschiedenis bij van alle vragen en antwoorden in `GEMINI_CHAT_HISTORY.md`. Bij elke "resume" wordt dit bestand gecontroleerd en aangevuld om de volledige context van de gespreksvoering te behouden.
## Sessie Geschiedenis
- **2026-03-15 (Stability Release):** Versie verhoogd naar **0.9.2** (Build 3). Buildnaam: **"Chitty Chitty Death"**.
    - Fix: Standaard stamp code ingesteld op `000001`.
    - Fix: Geheugenbeheer verbeterd door afbeeldingen boven de 4096px automatisch te herschalen (voorkomt WebView crashes).
    - Fix: Native download-logica verbeterd; bestanden worden nu direct in de publieke `Downloads` map opgeslagen voor betere vindbaarheid op Android.
- **2026-03-15 (Bugfix Release):** Versie verhoogd naar **0.9.1** (Build 2). Buildnaam: **"I Never Met the Dead Man"**. 
...
    - Fix: `runOneClickShield` cropt nu het interior gedeelte fysiek (randloos) in plaats van pixels te wissen.
    - Fix: `bundleEvidence` wordt nu correct afgewacht via `await`.
    - Fix: UI toont nu correct de `ProcessingOverlay` door een korte pauze in de executie.
- **2026-03-15 (Rebranding):** Nieuwe branch `photoverify-v0.9` aangemaakt. Applicatie officieel hernoemd naar **PhotoVerify**. Versie gereset naar **0.9** (Build 1). Buildnaam: **"Death Has a Shadow"**. Alle configuratiebestanden en native strings bijgewerkt naar de nieuwe naam.
- **2026-03-15:** Setup Android SDK, Java 21 en Capacitor. Fix voor CORS via CapacitorHttp. Toevoeging Verbose Logging UI. Project-log geïnitieerd. Implementatie van `@capacitor/assets` voor automatische generatie van native Android app-iconen op basis van `appicon.jpg`. Geautomatiseerd via `npm run mobile:assets` in `package.json`.

## Project Status (Maart 2026)
Huidige fase: **Fase 4 (Rebranding & Stabilization)**. De app heet nu **PhotoVerify** en draait op versie 0.9.2.
Dit project is in de afrondende fase van **Fase 3: Native Wrapper (Capacitor)**. De app is geoptimaliseerd voor Android met native share-extensie ondersteuning.

## Belangrijke Omgevingsvariabelen (macOS)
- **Android SDK:** `/usr/local/share/android-commandlinetools`
- **Java Home:** OpenJDK 21 (via Homebrew: `$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home`)
- **Node/NPM:** Gebruik `npm run mobile:sync` en `npm run mobile:run` voor development.

## Recente Wijzigingen & Fixes
- **CORS / Netwerk:** Overgestapt van `fetch()` naar `CapacitorHttp` in `src/utils/license.ts` om CORS-beperkingen op Android te omzeilen.
- **Android Manifest:** `android:usesCleartextTraffic="true"` toegevoegd om lokale HTTP-ontwikkeling te ondersteunen.
- **Verbose Logging UI:** Een live "Network Log" toegevoegd aan het `LICENSE_CHECK` scherm (`App.tsx`) voor directe diagnostiek in de app.
- **Linting & TS:** Meer dan 20 kritieke fouten opgelost in `App.tsx`, `ImageLab.tsx` en `TimeAnchorVerifier.tsx`.
- **Versioning:** Android build-versie gesynchroniseerd met `src/version.json` (Huidige versie: 14.3, Build: 3).

## Configuratie Architectuur (Remote & Local)
- **Strategie:** "Remote-First met Local Fallback". De app probeert altijd eerst de nieuwste configuratie van de server te halen.
- **Configuratie URLs:** Opgeslagen in `localStorage`:
    - `license_server_url` (Licentie-server).
    - `ui_config_url` (UI/Stijl JSON).
    - `content_config_url` (Tekst/Content JSON).
- **Fallback Mechanisme:** Bij een mislukte fetch (`catch` blok in `App.tsx`) worden de gebundelde bestanden uit de `public/` map geladen.
- **Dynamic CSS:** De geladen JSON wordt via `applyUIConfig` direct toegepast op CSS custom properties (`--bg`, `--accent`, etc.).

## Content Configuratie Details
- **Bestand:** `public/content-config.json` (wordt ook remote opgehaald).
- **Inhoud:** Bevat alle tekstuele elementen: titels, navigatie-labels, help-pagina's en technologische uitleg (10 diepgaande onderwerpen).
- **Doel:** Maakt de app "taal-agnostisch" en maakt het mogelijk om instructies en juridische visies live bij te werken zonder app-update.

## Branding & Iconen
- **Logo:** `photoverify-logo.svg` (geconfigureerd in `ui-config.json`).
- **Web/PWA Iconen:** `appicon.jpg`, `favicon.svg` en `icons.svg`.
- **Native Android App-icoon:** Bevindt zich in `android/app/src/main/res/mipmap-*` (`ic_launcher.png`, `ic_launcher_round.png`).
- **UI Integratie:** Het logo wordt dynamisch getoond in de `App-header` via de `uiConfig.branding.logoUrl` eigenschap.

## License Manager (Activatie Tool)
- **Bestand:** `license-manager.html` (standalone tool).
- **Doel:** Handmatig genereren van licentie-JSON-bestanden voor specifieke Device ID's.
- **Features:** Instellen van vervaldatum (in dagen), status (Active/Revoked) en export als JSON-bestand.
- **Implementatie:** Gegenereerde bestanden moeten geüpload worden naar de map `/licenses/` op de licentieserver (bijv. `https://fotolerant.nl/licenses/[ID].json`).

## UI Editor (Sovereign Studio PRO)
- **Bestand:** `ui-studio.html` (volledig vernieuwd).
- **Doel:** Volledig dynamische editor voor *alle* velden in `ui-config.json` en `content-config.json`.
- **Features:** 
    - Recursieve rendering van geneste objecten en arrays (bijv. alle 10 help-pagina's).
    - Slimme veld-detectie (kleuren, lange teksten, booleans).
    - Live mobiele preview.
    - Raw JSON editor voor directe manipulatie.
    - **JSON Import:** Mogelijkheid om bestaande `ui-config.json` en `content-config.json` bestanden te uploaden via de UI om ze direct te bewerken.
- **Workflow:** Importeren -> Bewerken -> Preview -> Export (genereert nieuwe JSON-bestanden).

## Configuratie Architectuur (Remote & Local)
- **Configuratie-bestand:** `public/ui-config.json` (wordt ook remote opgehaald).
- **Thema's:** Ondersteunt `dark` en `light` modes via CSS variabelen.
- **Platform-optimalisatie:** Bevat specifieke overrides voor Desktop, Tablet en Mobile (iOS/Android).
- **Styling:** Gebruikt een combinatie van Vanilla CSS (`App.css`) en dynamische properties voor `borderRadius`, `padding` en `fontSize`.

## Versioning Strategie
- **Huidige Build:** 0.9.2 (Build 3)
- **Thema:** "Chitty Chitty Death" (S01E03 - Peter richt per ongeluk een ravage aan in de stad).
- **Feitje:** In deze aflevering probeert de familie te bewijzen dat ze een goede invloed hebben, wat mooi aansluit bij de verbeterde download-logica en de stabiliteit die we nu bewijzen.
- **Source of Truth:** `src/version.json` bepaalt de versie die in de UI getoond wordt.
- **Proactief Beheer:** Gemini doet zelf voorstellen voor:
    - **Punt-release (vX.X.1):** Bij bugfixes of kleine optimalisaties.
    - **Minor/Major release (vX.1 / v2.0):** Bij substantiële functionele uitbreidingen.
- **Thematische Builds:** Bij elke APK release krijgt de build een unieke naam in de sfeer van **Family Guy**.
    - De naam moet een associatie oproepen met de wijziging (bijv. "Evil Monkey" voor een hardnekkige bugfix of "Blue Harvest" voor een grote visuele update).
    - Inclusief een uniek feitje of citaat uit de serie om de herkenbaarheid te vergroten.
- **Android Sync:** Bij elke build wordt `android/app/build.gradle` bijgewerkt (`versionName` sync, `versionCode` +1).
- **App Name:** De `appName` in `capacitor.config.ts` volgt de versie en themanaam.

## Licentie Systeem Details
- **Storage:** De licentiestatus wordt opgeslagen in `localStorage` onder de sleutel `photovault_license_state`.
- **Device Hash:** Wordt gegenereerd op basis van hardware-ID en model via `@capacitor/device`.

## Openstaande Punten
- [ ] Testen van de native Share-extensie (Intent SEND) op een fysiek device.
- [ ] Valideren van de `CapacitorHttp` response op verschillende netwerkcondities.
- [ ] Eventueel implementeren van Haptic Feedback voor verificatie-resultaten (Phase 2).

---
*Dit logbestand wordt gebruikt door Gemini om de context van het project te behouden bij het hervatten van sessies.*
