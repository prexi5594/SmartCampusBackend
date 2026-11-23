# Install Smart Campus on Android

`SmartCampus-0.1.0-debug.apk` is the locally built, debug-signed Android prototype.
It is 5,478,631 bytes, with package ID `org.smartcampus.navigator`, version 0.1.0,
minimum Android API 24 and target API 36. A SHA-256 file is provided alongside it.

1. Copy the APK to your Android phone, for example over USB.
2. Open it on the phone and follow Android's installation prompts.
3. Open **Smart Campus** and choose **Try waypoint simulation**.
4. Select **Start directions**, then use the simulated movement controls.
5. Return to USIU to browse actual candidate buildings/rooms. **Use my location**
   requests device location explicitly; allow precise location for useful positioning.

No phone was connected during the build, so this APK has not been installed or
physically tested. The debug signature and packaged assets were verified on
23 November 2026. This is not a signed Play Store release.

**Real USIU walking routes are still unavailable.** Entrances and allowed paths
must be confirmed before the app can guide a real journey. The simulation is
fictional and does not use the device's location. The app does not provide room
floors or indoor positioning. Keep it on screen for guidance; background/locked
phone behaviour needs device testing.

For USB installation from the prepared project, after authorising the connected
phone for debugging, run from `mobile`:

```powershell
.\.android-tools\sdk\platform-tools\adb.exe install releases\SmartCampus-0.1.0-debug.apk
```

To rebuild with the already installed local Java/SDK/Gradle tools:

```powershell
node scripts/build.mjs
node node_modules/@capacitor/cli/bin/capacitor sync android
.\scripts\build-android.ps1
.\scripts\build-android.ps1 -VerifyOnly
```

The rebuild writes `android/app/build/outputs/apk/debug/app-debug.apk`; this
release-folder copy is the verified 23 November build, not an automatic alias.
See `../README.md` and `../../docs/PHONE_NAVIGATION.md` for code and campus tests.
