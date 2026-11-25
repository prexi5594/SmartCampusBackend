$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
try {
    node scripts/build.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Web asset build failed.' }
    node node_modules/@capacitor/cli/bin/capacitor sync android
    if ($LASTEXITCODE -ne 0) { throw 'Native sync failed.' }
    & "$PSScriptRoot/build-android.ps1"
    & "$PSScriptRoot/build-android.ps1" -VerifyOnly
    python scripts/package-apk.py
    if ($LASTEXITCODE -ne 0) { throw 'APK packaging failed.' }
} finally { Pop-Location }
