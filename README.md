# WAYO 104.3FM

A native iPhone and Android radio app built with **Expo SDK 57**, React Native 0.86.3, React 19.2.3, and TypeScript. The radio workflow takes inspiration from DFM’s live listening, programming, archive, and community navigation, with WAYO’s own branding and destinations.

## Download from GitHub

Use **Code → Download ZIP** to download this repository, or download [the complete app source ZIP](https://github.com/herrickalan/WAYOFM/raw/refs/heads/main/downloads/WAYO-SDK57-source.zip). The app source ZIP includes the generated Swift iOS and Kotlin Android projects as well as the shared app source, assets, and build instructions. It contains source code, not an installable APK or IPA.

The repository tree keeps generated `ios/` and `android/` directories out of version control; regenerate them with `npm run prebuild -- --no-install`, or use the included source ZIP.

## Included

- **Listen:** native live audio, persistent player, pause/resume at the live edge, startup and playback-stall detection, up to two automatic reconnects, connection cancellation, manual retry and website fallback. Background audio and lock-screen controls are configured for native development/production builds.
- **Watch:** Mixcloud Live, archived episodes, and YouTube players stay within WAYO’s main layout, with its header, live controls, and all four tabs visible. Labeled **Back** and **Home** buttons return to the previous screen or Listen. YouTube includes three station-featured Live at WAYO performances and a video picker, available from Listen and Community. Opening media pauses live radio; leaving its screen stops the embedded player.
- **Explore:** Live at WAYO, Show Guide, daily Schedule, About, News, and Supporters. These station-maintained pages open inside the native app using WebView, keeping content current.
- **Archives:** live Mixcloud API data, episode artwork, dates and durations, search across loaded episodes, pagination, and Mixcloud’s embedded episode player. Live radio pauses before watching video or playing an archive. No sample episodes are shipped in the app.
- **Community:** browser-based donation, volunteering, DJ application, and subscription; call, SMS, email, social accounts, map directions, and full studio/mailing/inquiry information.
- **Branding:** the original `weblogo_trans.png` logo and supplied `wowee-progress.png` rocket, bundled locally. The rocket appears during app startup, archive loading, and native page/player loading, and is configured as the native launch image.

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

To use updates, run `git pull` in a Git clone, or download the latest source ZIP into a fresh folder. Then run `npm ci` and `npx expo start --go --clear`, reopen Expo Go, and scan the new QR code. The rocket loading view runs inside the app; Expo Go controls its own initial launch screen. Test the configured native rocket launch screen with a WAYO development or production build.

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

Each live connection has a 15-second startup limit, including audio-session preparation and URL resolution. Playback must advance before the UI declares it connected. After playback starts, a 12-second stall triggers a fresh connection at the live edge. The player makes two automatic retries with one- and two-second delays, then provides a manual retry and website fallback. Thirty seconds of healthy playback restores the retry budget for a later interruption. Cancelling releases the media source and invalidates pending work so late responses cannot restart playback. Suspended background timers do not count as a stall on return to the foreground; native system pauses are respected.

The archive reads `https://api.mixcloud.com/wayoradio/cloudcasts/?limit=20` and follows validated pagination URLs. The complete station archive remains accessible at `https://wayofm.org/episodes`. Live audio and archived Mixcloud playback use separate services; archived audio is played by Mixcloud’s official widget rather than downloading protected media.

YouTube uses its official iframe player for The Thriffs, Rayanna and the Feral Dogs, and East Esker, verified against `https://wayofm.org/shows/live-wayo` on October 11, 2026. This is a curated selection rather than an automatic list of all channel uploads. Add or replace entries in `YOUTUBE_VIDEOS` in `src/config.ts`. Playback starts when the user taps the provider’s play control. Playback normally stays inline; choosing the provider’s fullscreen control opens its fullscreen view, which can be dismissed with Done/Back. Provider login or embedding restrictions can still apply.

Media uses the app’s content area, keeping WAYO navigation visible during playback. Back returns to the originating tab and preserves loaded archive episodes and search text. Home and the WAYO logo return to Listen; any tab closes the player and opens that tab. Android’s system Back also closes the player. Starting live radio from the station controls first closes embedded media to prevent overlapping audio. Station information pages continue to use their separate page viewer.

Native provider links to YouTube videos or WAYO archive episodes are converted into embedded players. Provider app-launch schemes and automatic external-window requests are blocked rather than opening another app. Iframe sandbox rules also prevent embedded pages from replacing the app or opening popup windows. The native player error screen offers an explicit Open in browser fallback; a failed featured YouTube player’s fallback opens the WAYO channel.

Native embedded players load inside an HTML wrapper with `https://wayofm.org/` as its base URL and a referrer policy, supplying the client identification YouTube requires. A bare YouTube embed URL without a Referer can fail with player error 153. Mixcloud Live uses its live page inside the native WebView; archive episodes use the dedicated Mixcloud widget.

The **Watch** button opens Mixcloud Live and is distinct from **Live at WAYO**, which opens the station’s show page. Native media navigation allows the live page’s own initial request and canonical URL redirects before converting other provider links. This avoids cancelling the Watch page’s load by routing it back to itself.

All user-provided destinations are centralized in `src/config.ts`. The numeric equivalent of `(585) 203-WAYO` is `(585) 203-9296`. Contact text was verified against the station’s contact page on October 11, 2026. The station-maintained contact page remains accessible inside the app if those details change.

Bundled originals came from:

- `https://wayofm.org/images/weblogo_trans.png` (1000 × 158)
- `https://wayofm.org/images/wowee-progress.png` (317 × 200)

The two images match the supplied artwork and were copied without modification. `npm run assets` registers original images present in `assets/` and creates fallback launcher icons only if absent. Run this asset helper intentionally when changing branding; it writes `src/branding.ts`. It is not part of automated environment installation.

## Validation

```sh
npm run check                 # TypeScript and 22 service/player tests
npm run export                # iOS, Android, and web production bundles
npm run test:e2e              # web export and 12 mobile-viewport browser tests
```

In the cloud, set the cache/Expo variables above before export/e2e commands. Browser tests require Python 3 and Chromium. This machine provides `/usr/bin/chromium`; set `CHROMIUM_PATH` for a different installation. Playwright automatically serves the export during testing. Fixture data/audio are test-only and do not ship in the application.

The current implementation passed the type check, all 22 service/player tests, and all 12 browser tests. The iOS/Android/web bundles exported successfully, and both native projects generated successfully. Player regressions cover hung preparation/resolution, frozen playback clocks, buffering, retry limits, cancellation, system pause/resume, background timer suspension, provider link conversion, app-launch rejection, and the native Watch page’s initial load/canonical redirects. Browser tests exercise navigation, archives, actual fixture audio playback, post-start stall recovery, embedded video selection, and the rocket loading view. They verify the Watch label and loaded fixture content, visible WAYO navigation during playback, Back/Home/tab return paths, preserved archive searches, live-radio handoff, containment of provider popups/top-level navigation, and layouts at 320 × 568 and 390 × 844. The public archive API returned current WAYO episodes. On October 11, 2026, a 20-second station-stream probe returned HTTP 200 and continuous, decodable 192 kbps stereo MP3, and the Mixcloud Live page and its trailing-slash redirect returned HTTP 200. These checks verify endpoints at that time, not playback on a phone. The cloud proxy blocks YouTube, so YouTube integration was tested with iframe fixtures rather than actual YouTube playback. Native iPhone/Android behavior, provider playback on devices, and signed binaries remain untested.

## Cloud environment

Reusable installation and startup instructions are saved in the environment configuration draft. Review/save the draft network additions and publish the environment to retain the prepared files and dependencies. Saving the draft alone does not apply its settings, publish a snapshot, or prove restoration in a future task.

The app needs no backend or secret for its public station pages, audio endpoint, or public Mixcloud API. Required destinations include `wayofm.org`, `streaming.wayofm.org`, `api.mixcloud.com`, `www.mixcloud.com`, and `thumbnailer.mixcloud.com`. Donation, application, map, and social destinations are also recorded in the draft. When testing browser-opened content from inside the cloud environment, third-party sites may request additional subdomains; add only the destinations required by the observed operation.
