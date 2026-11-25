# Install the latest Smart Campus Android app

Download `SmartCampus-latest-debug.apk` (currently version 0.1.1, version code 2, built 24 November 2026). The versioned copy is `SmartCampus-0.1.1-debug.apk`. Size: 5,491,450 bytes. SHA-256: `1741a21758413323c01ba754a661d2b04616ab797cc7359a6fae6194bd21e781`.

1. Copy the latest APK to your Android phone and open it to install/update Smart Campus.
2. Choose **Open Lab H guide** for Gate A → Science Centre → Floor 1 Lab H.
3. Use Start, Next, Previous and Stop to confirm checkpoints manually. Ground, Floor 1 and Floor 2 diagrams are included.
4. The existing destination search, device-location display and fictional waypoint simulation remain available.

The guide is bundled locally. It includes assumed paths, estimated entrance connections and schematic room outlines. It does not automatically locate you indoors. Verified GPS routing remains unavailable until the campus network is reviewed. The web accounts/saved-places link opens the hosted service and requires internet; native account integration is not included.

Verification: 27 Node tests passed; browser checks covered the app-to-guide link, start, next, floor switching, stop and entrance handoff with no captured errors/warnings. APK signature v2 and ZIP integrity passed; all 21 web assets match the build. Physical Android installation/GPS testing remains outstanding. This is a debug build, not a Play Store release. The old 0.1.0 file is retained as an archive; use the latest link above.

From `mobile`, rebuild, sync, compile, verify and refresh both download copies:

```powershell
.\scripts\release-android.ps1
```

This command uses the already installed local Java/SDK and Python. It writes checksums and `latest.json` with all asset hashes. It is a manual release command, not an automatic background updater. Increment package.json and Android versionCode/versionName for the next release.

For USB installation with an authorised debugging connection:

```powershell
.\.android-tools\sdk\platform-tools\adb.exe install -r releases\SmartCampus-latest-debug.apk
```
