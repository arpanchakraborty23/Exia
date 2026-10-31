# Exia Mobile — CI/CD Pipeline & GitHub Actions APK Generation Guide

This guide explains how to automatically validate code and compile installable Android `.apk` files using **GitHub Actions cloud runners**. This is ideal if your local computer has limited hardware resources, lacks Android Studio/SDK, or cannot run heavy Gradle native builds.

---

## 1. Why Build on GitHub Actions?

Native React Native and Expo builds with WebRTC drivers (`@livekit/react-native` and `@config-plugins/react-native-webrtc`) compile C++ native binaries and heavy Android Gradle dependencies. 

Building on **GitHub Actions Ubuntu runners** provides:
* **Zero Local System Load**: Your laptop does not need Java 17, Android Studio, the Android SDK, or gigabytes of Gradle caches.
* **100% Free**: Uses standard GitHub Actions compute minutes without consuming your Expo Application Services (EAS) monthly build quota.
* **Direct Downloadable Artifacts**: The workflow generates an `.apk` file that you can download directly from the GitHub web interface and install on your phone.
* **Continuous Quality Assurance**: Automatically runs TypeScript checks, Vitest unit tests, and Expo linter on every pull request and push to `main`.

---

## 2. CI/CD Architecture Overview

The pipeline is defined in [`.github/workflows/mobile-ci-cd.yml`](file:///E:/potfolio/Exia/.github/workflows/mobile-ci-cd.yml):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Actions Cloud Pipeline                          │
│                                                                                 │
│  [ Git Push / PR / Manual Dispatch ]                                            │
│                 │                                                               │
│                 ▼                                                               │
│  ┌──────────────────────────────┐                                               │
│  │     Job 1: validate          │  pnpm 12.16.1 · Node.js 20                    │
│  │  • TypeScript Check (7 pkgs) │  tsc --noEmit across workspace                │
│  │  • Vitest Unit Tests         │  27/27 test suites                            │
│  │  • Expo Linting              │  eslint-config-expo verification              │
│  └──────────────┬───────────────┘                                               │
│                 │                                                               │
│                 ▼ (When triggered via Workflow Dispatch)                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                      Job 2: build-runner-apk                              │  │
│  │  • Java 17 (Temurin) & Android SDK Environment                            │  │
│  │  • Expo Prebuild (`npx expo prebuild --platform android --clean`)         │  │
│  │  • Gradle Compilation (`./gradlew assembleDebug` or `assembleRelease`)    │  │
│  │  • Automatic Signing (Debug Certificate or Self-Signed Release)           │  │
│  │  • Upload Artifact (`exia-mobile-apk-debug.zip`)                          │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                 │                                                               │
│                 ▼                                                               │
│  ┌──────────────────────────────┐                                               │
│  │   Downloadable .apk File     │  Ready for immediate Android installation     │
│  └──────────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. How to Build an APK on GitHub Actions (Step-by-Step)

Follow these steps to generate and download your Android `.apk`:

### Step 1: Open GitHub Actions
1. Navigate to your Exia repository on GitHub in your web browser.
2. Click on the **Actions** tab at the top of the repository.

### Step 2: Select the Workflow
1. In the left sidebar under **Workflows**, click on **"Exia Mobile — CI/CD & Android APK Build"**.
2. On the right side, click the **Run workflow** dropdown button.

### Step 3: Choose Build Options
You will see the following parameters:
* **Use workflow from**: Select `main` (or your active branch).
* **Build Target**:
  * `apk-debug` *(Recommended)*: Compiles a debug-signed `.apk`. It builds faster and is pre-signed with the standard Android debug certificate, making it installable on any Android device immediately.
  * `apk-release`: Compiles a release-optimized `.apk` (signed with a self-signed key for sideloading).
  * `eas-cloud-preview`: Dispatches the build to Expo's EAS cloud servers (requires `EXPO_TOKEN` secret).
  * `validation-only`: Runs TypeScript checking and tests without generating an APK.
* **Run Typecheck & Unit Tests before building**: Kept checked (`true`) by default to ensure only verified code is built.

Click **Run workflow**.

---

## 4. How to Download and Install the APK

1. Once the workflow starts, click on the running job to view the live logs.
2. The build process typically takes **4 to 7 minutes** on GitHub's Ubuntu runners.
3. Once completed with a green checkmark (✅):
   * Scroll down to the bottom of the page to the **Artifacts** section.
   * You will see an artifact named **`exia-mobile-apk-debug`** (or `exia-mobile-apk-release`).
   * Click on the artifact link to download the `.zip` archive.
4. **Extract the ZIP**:
   * Inside the downloaded zip file is the `.apk` file (e.g. `app-debug.apk`).
5. **Install on Your Phone**:
   * Transfer the `.apk` file to your Android phone via USB, Google Drive, WhatsApp, or email.
   * Tap on the file on your phone to install. If prompted, enable **"Install unknown apps"** in Android Settings.

---

## 5. Alternative: EAS Cloud Build via GitHub Actions

If you prefer Expo's official EAS Cloud infrastructure to compile the `.apk` or `.aab`:

1. Get an Expo access token from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
2. Add the token to your GitHub repository:
   * Go to **Settings > Secrets and variables > Actions**.
   * Click **New repository secret**.
   * Name: `EXPO_TOKEN`
   * Value: `<your-expo-access-token>`
3. In the GitHub Actions **Run workflow** dropdown, select `eas-cloud-preview`.
4. The workflow will automatically authenticate with EAS and trigger the build on Expo's cloud.

---

## 6. Monorepo Scripts Reference

All mobile scripts are accessible from the root `ui/` directory:

| Command | Purpose |
|---|---|
| `pnpm --dir ui mobile:start` | Start Metro bundler |
| `pnpm --dir ui mobile:lint` | Run ESLint verification |
| `pnpm --dir ui typecheck` | Run TypeScript checking across all workspace packages |
| `pnpm --dir ui test` | Run Vitest unit tests |
| `pnpm --dir ui/apps/mobile typecheck` | TypeScript checking on mobile app |
