# Exia — Android Client (Capacitor)

Packages the shared web UI (`apps/web` static export) as an Android application.

## Prerequisites

- Node.js ≥ 20
- JDK 17
- Android Studio (SDK 35+) — needed to build/sign, not to scaffold

## Workflow

```bash
# 1. Build the shared web app (once, or after web changes)
cd ../web
npm run build          # outputs apps/web/out

# 2. Copy web build + sync into the native project
cd ../android
npm install
npm run sync           # copies ../web/out -> www/, then cap sync android

# 3. Build an APK
npm run apk:debug      # debug APK via Gradle
npm run apk:release    # release APK (needs signing config)

# ...or open in Android Studio
npm run open
```

## Notes

- `androidScheme: https` is set in `capacitor.config.ts` so LiveKit WebRTC (mic/camera) runs in a secure context.
- Permissions `INTERNET`, `RECORD_AUDIO`, `CAMERA` are declared in `android/app/src/main/AndroidManifest.xml`.
- The backend API base URL is injected at web build time via `NEXT_PUBLIC_API_URL` (see the deployment plan).
