# Smart Campus Android app

Updated 24 November: the APK includes the latest Gate A → Lab H manual guide and three floor diagrams, bundled from the shared web sources. Web accounts remain on the hosted service. Run `scripts/release-android.ps1` to refresh the verified download; see `releases/README.md`. Earlier verification details below describe the initial 0.1.0 build.

Android-first Capacitor app authorised on 23 November 2026. A debug-signed APK
has been built and verified at `releases/SmartCampus-latest-debug.apk` (version 0.1.1, 5.49 MB).
See `releases/README.md` to install it. It has not been tested on a physical phone
and is not a production campus navigation release.

The app reuses the USIU map and navy/blue design. It includes destination/room
search, a device-position marker and accuracy circle, manual starting entrances,
route preview, waypoints, remaining distance, walking-time estimates, arrival,
rerouting and Stop. Location is explicit and held in memory on the device.
No accounts, location history, analytics or remote map service were added to
the phone app. Separate web-account work does not authenticate this app.

**USIU walking routes require verified entrances and paths.** The production
routing file is deliberately empty. Its OSM building centres are display pins,
not entrances. The separately labelled simulation uses fictional coordinates
near 0°, 0° and never uses phone GPS. It exercises the actual routing engine.

## Preview the interface

From this `mobile` folder, with the generated `dist` folder present:

```powershell
node scripts/preview.mjs
```

Open [the local preview](http://127.0.0.1:8770/). Stop with Ctrl+C. This loopback
address is not available on a separate phone. Browser preview does not install
an Android app. Append `?renderer=svg` to inspect the basic 2D map.

Choose **Try waypoint simulation** → **Start directions**. Use **Move to next
waypoint**, **Test weak signal** and **Test leaving route**. The last waypoint
requires a second accurate update before arrival. Stop ends the session;
**Return to USIU** restores the real catalogue and its unverified-route state.

## Clean installation and rebuild

Use a standard Node.js 22+ installation with npm. From `mobile`:

```powershell
npx pnpm@11.25.0 install --frozen-lockfile
node scripts/build.mjs
node node_modules/@capacitor/cli/bin/capacitor sync android
node scripts/preview.mjs
```

Versions are pinned in `package.json` and `pnpm-lock.yaml`. Capacitor provides
the Android shell, Geolocation provides device positions and App provides
lifecycle events. esbuild bundles the imports. The MapLibre renderer and campus
files are copied from the existing prototype. Rebuild and sync after edits;
`dist` and Android's copied web assets are generated output.

This Codex session had bundled Node/pnpm but no npm command on PATH. It invoked
the bundled pnpm CLI through Node; no global package manager was installed.

## Build Android

This project now has local Java 21, Android SDK API 36, build-tools 35/36,
platform-tools and Gradle under ignored `.android-tools`. The owner explicitly
accepted the SDK licence and authorised installation. No global environment
settings were changed. Rebuild using these already prepared tools:

```powershell
node scripts/build.mjs
node node_modules/@capacitor/cli/bin/capacitor sync android
.\scripts\build-android.ps1
.\scripts\build-android.ps1 -VerifyOnly
```

The build script sets Java/SDK/cache paths only for its process and restores
the previous environment. The native project already exists; do not run
`cap add android` again. Location is requested after **Use my location**; no
background-location permission is declared. GPS hardware is optional so the
manual route preview remains available.

On another computer, install Android Studio and SDK API 36 plus Gradle's
requested build tools, or prepare an equivalent local toolchain. Open this
project with:

```powershell
node node_modules/@capacitor/cli/bin/capacitor open android
```

With Java/SDK configured, `android/gradlew.bat assembleDebug --no-daemon` also
works from the `android` folder. Build output, relative to `mobile`:
`android/app/build/outputs/apk/debug/app-debug.apk`.
The `releases` folder contains the latest verified build and a
SHA-256 file. It is not automatically refreshed by rebuilding. Android Studio
itself was not installed. Release signing, Google Play publication, iOS and
web-to-phone transfer are not configured.

## Code guide

| File | Responsibility |
| --- | --- |
| `src/index.html`, `src/styles.css` | Responsive screens and accessible controls |
| `src/app.mjs` | Selection, native permissions, route state and foreground lifecycle |
| `src/map.mjs` | Local MapLibre map, route/location overlays and basic SVG fallback |
| `src/data.mjs` | Campus catalogue adapter and fictional simulation |
| `../shared/navigation.mjs` | Geographic routing, waypoints, arrival and deviation logic |
| `../shared/location-session.mjs` | One watch, including cancellation during pending registration |
| `../prototype/data/usiu-routing.json` | Reviewed paths/entrances; currently empty |
| `scripts/build.mjs` | Bundle code and copy campus assets |
| `android/app/src/main/AndroidManifest.xml` | Native location permissions |

See `../docs/PHONE_NAVIGATION.md` for data requirements and physical acceptance.

## Actual verification — 23 November 2026

From the project root:

```powershell
node --test tests/usiu-data.test.cjs tests/navigation.test.mjs
```

All **21 tests passed**: campus facts, route connections/distances, restrictions,
closures, manual/GPS origins, disconnected paths, poor/stale fixes, ordered
waypoints, arrival confidence, deviation, simulation isolation, room search and
watch cancellation races. The sandbox initially blocked subprocesses; approved
execution outside that boundary passed.

The asset build, native generation and final `cap sync android` succeeded.
The first APK attempt failed because Java was missing. After the owner accepted
the SDK licence, official Java/SDK tools were installed locally with published
checksum checks. The legacy SDK download stalled and was recovered with the
current Android CLI, with metrics disabled. Gradle also installed its required
build-tools 35 under the same SDK. **assembleDebug succeeded: 154 tasks**.

`apksigner verify --verbose --print-certs` passed with APK Signature Scheme v2.
`aapt dump badging` confirmed Smart Campus, version 0.1.0, package
`org.smartcampus.navigator`, min SDK 24, target SDK 36 and the main activity.
The merged permissions include fine/coarse location and network state, with no
background-location permission. ZIP integrity passed; seven important packaged
assets matched `dist`, App/Geolocation registrations were present, and actual
USIU routing remained unverified/disabled. APK SHA-256:
`ab7b39fc3a5540ce6bc24518735f97c91e1eb44f5a98dd08807dcbd540534edd`.
`adb devices` found no connected phone; no installation was attempted.

Browser checks passed: simulation start/progress/weak signal/rerouting/arrival/
Stop, manual origin changes, B-Lab keyboard selection, distinct Lab B, unmapped
GH, empty results and explicit SVG zoom/reset. Measured CSS widths 360, 392, 768
and 1280 px had no horizontal overflow. The viewport tool needed calibration;
requested pixel dimensions were not assumed to equal CSS width. WebGL and
explicit basic-map rendering were inspected. No warning/error logs were
captured during checked journeys. Screenshot: `../docs/mobile-waypoint-preview.jpg`.

No physical phone, Android permission prompt, real campus journey, TalkBack,
native background transition or offline GPS was tested. Explicit SVG mode is
not evidence of automatic GPU-failure recovery on every phone. Location error
messages and pending-watch cancellation were logic-tested.

## Official references

Checked 23 November 2026:

- [Capacitor setup requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Location API and permissions](https://capacitorjs.com/docs/apis/geolocation)
- [App lifecycle](https://capacitorjs.com/docs/apis/app)
- [Android Studio](https://developer.android.com/studio)

The location plugin does not directly provide background navigation. This
version pauses when the app leaves the screen and requires another Start.
Bundled map files avoid network map requests; GPS performance offline still
depends on the device and must be checked.
