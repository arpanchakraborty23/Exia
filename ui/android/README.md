# Exia — Android Client (Capacitor)

Packages the shared web UI ([`ui/web`](file:///e:/potfolio/Exia/ui/web) Next.js static export) as a native Android application using **Capacitor 8**.

---

## 1. Prerequisites

- **Node.js** ≥ 20
- **JDK 17+** (required for Gradle CLI builds)
- **Android Studio** (SDK 35+) for debugging, emulation, or release signing

---

## 2. Fast Build via Script

The easiest way to compile or sync the Android application is using the root script:

```bash
# Debug APK compilation (outputs to release/Exia-debug.apk)
./scripts/android.sh

# Release APK compilation (outputs to release/Exia-release.apk)
./scripts/android.sh --release

# Sync web assets to Android project without running Gradle
./scripts/android.sh --sync-only

# Sync assets and open project directly in Android Studio
./scripts/android.sh --open
```

---

## 3. Manual Workflow

```bash
# 1. Build the shared web application
cd ../web
npm run build          # outputs to ui/web/out

# 2. Install dependencies & sync web build into Android shell
cd ../android
npm install
npm run sync           # copies ../web/out -> www/, then runs cap sync android

# 3. Build an APK using Gradle
npm run apk:debug      # debug APK via Gradle wrapper
npm run apk:release    # release APK (requires keystore signing config)

# Or launch in Android Studio
npm run open
```

---

## 4. Key Configuration Notes

- **Secure Origin (`androidScheme: 'https'`)**: Configured in `capacitor.config.ts` so LiveKit WebRTC microphone and camera streams execute in a secure browser context.
- **Hardware Permissions**: `INTERNET`, `RECORD_AUDIO`, and `CAMERA` permissions are declared in the Android native manifest.
- **Backend API URL**: Configurable at build time via `NEXT_PUBLIC_API_URL` or dynamically in the in-app Settings view.
