param([switch]$VerifyOnly)
$ErrorActionPreference = 'Stop'
$mobileRoot = Split-Path -Parent $PSScriptRoot
$toolRoot = Join-Path $mobileRoot '.android-tools'
$javaFolders = @(Get-ChildItem -LiteralPath (Join-Path $toolRoot 'java') -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe') })
if ($javaFolders.Count -ne 1) { throw 'Expected one project-local Java installation under mobile/.android-tools/java.' }
$javaRoot = $javaFolders[0].FullName
$sdkRoot = Join-Path $toolRoot 'sdk'
if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot 'platforms/android-36/android.jar'))) { throw 'Install Android SDK platform 36 in mobile/.android-tools/sdk first.' }
$savedEnvironment = @{}
foreach ($key in @('JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT', 'ANDROID_USER_HOME', 'GRADLE_USER_HOME', 'PATH')) { $savedEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
try {
    $env:JAVA_HOME = $javaRoot
    $env:ANDROID_HOME = $sdkRoot
    $env:ANDROID_SDK_ROOT = $sdkRoot
    $env:ANDROID_USER_HOME = Join-Path $toolRoot 'android-user-home'
    $env:GRADLE_USER_HOME = Join-Path $toolRoot 'gradle-home'
    $env:PATH = (Join-Path $javaRoot 'bin') + [IO.Path]::PathSeparator + $env:PATH
    Push-Location -LiteralPath (Join-Path $mobileRoot 'android')
    try {
        if ($VerifyOnly) {
            & (Join-Path $sdkRoot 'build-tools/36.0.0/apksigner.bat') verify --verbose --print-certs 'app/build/outputs/apk/debug/app-debug.apk'
        } else {
            & .\gradlew.bat assembleDebug --no-daemon --console=plain
        }
        if ($LASTEXITCODE -ne 0) { throw "Android command failed with exit code $LASTEXITCODE." }
    } finally { Pop-Location }
} finally {
    foreach ($key in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $savedEnvironment[$key], 'Process') }
}
