# Gemini Project Log: Picture Copyright / PhotoVault

## Mandaten
- **Documentatie-plicht:** Alle door de gebruiker verstrekte informatie en beslissingen moeten direct worden verwerkt in de relevante `.md` bestanden of broncode-bestanden om continuïteit tussen sessies te garanderen.
- **Rapportage-plicht:** Bij elke handeling moet Gemini expliciet vermelden welke bestanden zijn aangepast en waarom.

## Sessie Geschiedenis
- **2026-03-15:** Setup Android SDK, Java 21 en Capacitor. Fix voor CORS via CapacitorHttp. Toevoeging Verbose Logging UI. Project-log geïnitieerd. Implementatie van `@capacitor/assets` voor automatische generatie van native Android app-iconen op basis van `appicon.jpg`. Geautomatiseerd via `npm run mobile:assets` in `package.json`.

## Project Status (Maart 2026)
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

## UI Editor (Sovereign Studio)
- **Bestand:** `ui-studio.html` (standalone tool).
- **Doel:** Visuele editor voor `ui-config.json` en `content-config.json`.
- **Features:** Live preview op een "mock device", aanpassing van accentkleuren, hoek-afronding (radius) en tekstuele content.
- **Workflow:** Wijzigingen worden geëxporteerd als JSON-bestanden die handmatig in de `public/` map geplaatst moeten worden.

## UI Configuratie Details
- **Configuratie-bestand:** `public/ui-config.json` (wordt ook remote opgehaald).
- **Thema's:** Ondersteunt `dark` en `light` modes via CSS variabelen.
- **Platform-optimalisatie:** Bevat specifieke overrides voor Desktop, Tablet en Mobile (iOS/Android).
- **Styling:** Gebruikt een combinatie van Vanilla CSS (`App.css`) en dynamische properties voor `borderRadius`, `padding` en `fontSize`.

## Licentie Systeem Details
- **Storage:** De licentiestatus wordt opgeslagen in `localStorage` onder de sleutel `photovault_license_state`.
- **Device Hash:** Wordt gegenereerd op basis van hardware-ID en model via `@capacitor/device`.

## Openstaande Punten
- [ ] Testen van de native Share-extensie (Intent SEND) op een fysiek device.
- [ ] Valideren van de `CapacitorHttp` response op verschillende netwerkcondities.
- [ ] Eventueel implementeren van Haptic Feedback voor verificatie-resultaten (Phase 2).

---
*Dit logbestand wordt gebruikt door Gemini om de context van het project te behouden bij het hervatten van sessies.*
