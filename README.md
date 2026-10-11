# WAYO 104.3FM

A native iPhone and Android radio app built with **Expo SDK 57**, React Native 0.86.3, React 19.2.3, and TypeScript. The radio workflow takes inspiration from DFM’s live listening, programming, archive, and community navigation, with WAYO’s own branding and destinations.

## Download from GitHub

Use **Code → Download ZIP** to download this repository, or download [the complete app source ZIP](https://github.com/herrickalan/WAYOFM/raw/refs/heads/main/downloads/WAYO-SDK57-source.zip). The app source ZIP includes the generated Swift iOS and Kotlin Android projects as well as the shared app source, assets, and build instructions. It contains source code, not an installable APK or IPA.

The repository tree keeps generated `ios/` and `android/` directories out of version control; regenerate them with `npm run prebuild -- --no-install`, or use the included source ZIP.

## Included

- **Listen:** native live audio, persistent player, pause/resume at the live edge, connection cancellation, retry and website fallback. Background audio and lock-screen controls are configured for native development/production builds.
- **Explore:** Live at WAYO, Show Guide, daily Schedule, About, News, and Supporters. These station-maintained pages open inside the native app using WebView, keeping content current.
- **Archives:** live Mixcloud API data, episode artwork, dates and durations, search across loaded episodes, pagination, and Mixcloud’s embedded episode player. Live radio pauses before watching video or playing an archive. No sample episodes are shipped in the app.
- **Community:** browser-based donation, volunteering, DJ application, and subscription; call, SMS, email, social accounts, map directions, and full studio/mailing/inquiry information.
- **Branding:** the original `weblogo_trans.png` logo and `wowee-progress.png` rocket loading image, bundled locally. The rocket is also configured as the native launch image.

## Run

Use Node.js 22.13+ (Node 24 was used here) and npm.

Install **Expo Go** on your phone and open a terminal in the downloaded app folder containing `package.json`:

```sh
npm ci
npm start
```

`npm start` explicitly selects Expo Go. The terminal should say **Using Expo Go** and show an `exp://` URL below the QR code. Keep the terminal running and connect your computer and phone to the same Wi-Fi. On iPhone, scan with the Camera app and tap the Open in Expo Go banner. On Android, scan with Expo Go’s QR scanner.

If you invoke Expo directly, use **`npx`**, including the Go flag:

```sh
npx expo start --go
```

Because this project also includes `expo-dev-client`, plain `npx expo start` can default to a custom development build. Its `exp+wayo-radio://` QR code cannot launch until that custom WAYO build has been installed on your phone. Press **s** in the Expo terminal to switch between Expo Go and the development build, or stop it with **Ctrl+C** and restart with `--go`.

If the QR code opens but the phone cannot reach Metro, check Wi-Fi, VPN, and your computer’s firewall. For a remote/cloud computer or an inaccessible local network, use a tunnel from your own terminal:

```sh
npx expo start --go --tunnel
```

Expo may ask to install its ngrok tunnel helper; follow the CLI prompt. Tunnel startup needs Internet access and must print a reachable URL before scanning. Expo’s offline CLI mode cannot be used with `--tunnel`; unset `EXPO_OFFLINE` if you previously set it. Cloud network policy can also block tunnel destinations, so use a local computer when cloud tunneling is unavailable.

Use an SDK 57 compatible Expo Go installation for a quick foreground smoke test. If Expo Go reports an SDK mismatch, update it. Use an installed native development build for background audio, Android media notifications, and lock-screen controls: `npm run start:dev`. Expo Go’s native settings do not substitute for testing the app’s own native binary.

For this cloud machine, caches and Expo’s optional online CLI checks need these settings:

```sh
export npm_config_cache=/workspace/.npm-cache
export EXPO_NO_TELEMETRY=1
export EXPO_OFFLINE=1
export EXPO_UNSTABLE_HEADLESS=1
npm start -- --host lan
```

`EXPO_OFFLINE` affects the CLI’s network calls; the application still accesses WAYO and Mixcloud. Use the existing isolated checkout; a separate Git worktree is unnecessary.

`EXPO_UNSTABLE_HEADLESS` prevents the optional Electron DevTools shell from launching in this headless cloud container; Metro remains available for development. Use ordinary Expo startup on your local desktop for GUI debugging.

`npm run web` runs the web companion. Station websites can restrict browser framing; the page toolbar provides a browser button. This restriction does not apply to the native top-level WebView. Archive playback is supplied by Mixcloud, whose own availability, login rules, and playback restrictions apply.

## Native projects and builds

`app.config.ts` defines the native projects. The current cloud checkout already contains generated `ios/` (Swift entry point) and `android/` (Kotlin entry points) directories. They are ignored because Expo Continuous Native Generation reproduces them from the config, assets, and locked dependencies:

```sh
npm run prebuild -- --no-install
```

For a local Android build, install Android Studio, its SDK/emulator, and a supported Java toolchain, then run `npm run android`. For an iPhone simulator/device build, use macOS with Xcode and CocoaPods, then run `npm run ios`. Do not hand-edit generated native directories; express durable native changes through the Expo config/plugins.

`eas.json` includes development, internal preview, and production profiles:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

For distributable builds, use `--profile production`. Before distribution, verify ownership/availability of the default bundle IDs `org.wayofm.radio`, configure signing in EAS, and supply store metadata and privacy/support URLs. An Expo account and appropriate Apple/Google developer accounts are needed for signing/distribution. No signing credentials are stored in this repository. EAS project initialization and signed native builds were not performed in the cloud task.

Native configuration enables the iOS `audio` background mode and the Android media playback foreground service. Microphone/recording permissions are disabled. Validate audio interruptions, Bluetooth, headphones, lock-screen controls, foreground/background transitions, and Mixcloud playback on physical iPhone and Android devices before release.

## Station integration

The live endpoint is `https://streaming.wayofm.org/wayo-192`, published by WAYO’s player script at `https://wayofm.org/sites/all/libraries/jplayer/skin/flat-audio/js/flat.audio.js`. It is configured in `src/config.ts` rather than scraping a web page on every play. For a future endpoint change, either update that constant or set `EXPO_PUBLIC_LIVE_STREAM_URL` in a local `.env` and restart Metro/rebuild. This variable is public configuration, not a secret. Do not put credentials in it.

The archive reads `https://api.mixcloud.com/wayoradio/cloudcasts/?limit=20` and follows validated pagination URLs. The complete station archive remains accessible at `https://wayofm.org/episodes`. Live audio and archived Mixcloud playback use separate services; archived audio is played by Mixcloud’s official widget rather than downloading protected media.

All user-provided destinations are centralized in `src/config.ts`. The numeric equivalent of `(585) 203-WAYO` is `(585) 203-9296`. Contact text was verified against the station’s contact page on October 11, 2026. The station-maintained contact page remains accessible inside the app if those details change.

Bundled originals came from:

- `https://wayofm.org/images/weblogo_trans.png` (1000 × 158)
- `https://wayofm.org/images/wowee-progress.png` (317 × 200)

The two images match the supplied artwork and were copied without modification. `npm run assets` registers original images present in `assets/` and creates fallback launcher icons only if absent. Run this asset helper intentionally when changing branding; it writes `src/branding.ts`. It is not part of automated environment installation.

## Validation

```sh
npm run check                 # TypeScript and 5 service tests
npm run export                # iOS, Android, and web production bundles
npm run test:e2e              # web export and 5 mobile-viewport browser tests
```

In the cloud, set the cache/Expo variables above before export/e2e commands. Browser tests require Python 3 and Chromium. This machine provides `/usr/bin/chromium`; set `CHROMIUM_PATH` for a different installation. Playwright automatically serves the export during testing. Fixture data/audio are test-only and do not ship in the application.

The current implementation passed the type check, all five service tests, and all five browser tests. The iOS/Android/web bundles exported successfully, and both native projects generated successfully. Mobile layouts at 390px and 320px were checked, with no horizontal overflow or JavaScript errors on the Listen screen. The public archive API returned current WAYO episodes. The cloud proxy denied the streaming host, so actual live-broadcast playback was not verified here; apply the saved domain additions in environment settings and retry. Audio playback was exercised with a decodable WAV fixture. Native device behavior and signed binaries remain untested.

## Cloud environment

Reusable installation and startup instructions are saved in the environment configuration draft. Review/save the draft network additions and publish the environment to retain the prepared files and dependencies. Saving the draft alone does not apply its settings, publish a snapshot, or prove restoration in a future task.

The app needs no backend or secret for its public station pages, audio endpoint, or public Mixcloud API. Required destinations include `wayofm.org`, `streaming.wayofm.org`, `api.mixcloud.com`, `www.mixcloud.com`, and `thumbnailer.mixcloud.com`. Donation, application, map, and social destinations are also recorded in the draft. When testing browser-opened content from inside the cloud environment, third-party sites may request additional subdomains; add only the destinations required by the observed operation.
