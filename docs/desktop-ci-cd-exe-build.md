# Exia Desktop — Windows .EXE Build Guide (GitHub Actions & Local)

This guide explains how to compile and package the Exia Windows Desktop application into a standalone **`.exe` executable** or **Windows Setup Installer** using **GitHub Actions** (cloud runner, zero laptop strain) or **Local Electron Builds**.

---

## 1. Desktop Architecture Overview

Exia's desktop client is powered by an **Electron desktop harness** wrapping the universal, responsive Expo client bundle:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Universal Expo Codebase                         │
│                           (ui/apps/mobile)                             │
│                                   │                                    │
│                 pnpm web:build    ▼                                    │
│       ┌───────────────────────────────────────────────────────┐        │
│       │               ui/apps/mobile/dist/                    │        │
│       │  Static SPA bundle (HTML5, JS chunks, icons, fonts)   │        │
│       └───────────────────────────┬───────────────────────────┘        │
│                                   │                                    │
│                     sync-dist.js  ▼                                    │
│       ┌───────────────────────────────────────────────────────┐        │
│       │                    desktop/dist/                      │        │
│       │  Electron Shell with LiveKit WebRTC media permissions │        │
│       └───────────────────────────┬───────────────────────────┘        │
│                                   │                                    │
│             electron-builder --win│                                    │
│                                   ▼                                    │
│       ┌───────────────────────────────────────────────────────┐        │
│       │                   Standalone .EXE                     │        │
│       │  • Exia Setup 0.1.0.exe (NSIS Windows Installer)      │        │
│       │  • Exia-portable-0.1.0.exe (Zero-install standalone)  │        │
│       └───────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Desktop Features:
* **LiveKit WebRTC Integration**: Electron automatically grants `microphone`, `camera`, and `display-capture` permissions so real-time voice and multimodal vision run seamlessly without browser prompts.
* **Dual Packaging Formats**:
  * **NSIS Installer (`Exia Setup.exe`)**: Traditional installer that creates Start Menu & Desktop shortcuts with uninstaller support.
  * **Portable Executable (`Exia-portable.exe`)**: Standalone single-file `.exe` that launches instantly without installation (great for USB drives or quick testing).

---

## 2. Cloud Build via GitHub Actions (Zero Local Load — Recommended)

If your local computer has limited RAM/CPU, you can compile the `.exe` entirely on GitHub's hosted Windows cloud runners for free:

### Step 1: Open GitHub Actions
1. Open your Exia repository on GitHub in your web browser.
2. Click on the **Actions** tab at the top.

### Step 2: Trigger the Desktop Workflow
1. In the left sidebar, click **"Exia Desktop — Windows EXE Build"**.
2. Click the **Run workflow** dropdown on the right:
   * **Use workflow from**: `main`
   * **Target Packaging Format**:
     * `all` *(Recommended)*: Generates both the NSIS Installer and the Portable single-file `.exe`.
     * `portable`: Builds only the standalone portable `.exe`.
     * `nsis`: Builds only the Windows Setup Installer.
   * **Run Typecheck and Tests before building**: Checked (`true`).
3. Click the green **Run workflow** button.

### Step 3: Download Your .EXE File
1. The GitHub cloud runner will bundle and package the application in **3 to 5 minutes**.
2. When the build completes with a green checkmark (✅), click on the workflow run.
3. Scroll down to the **Artifacts** table at the bottom of the summary page.
4. Click on **`exia-windows-desktop-exe`** to download the ZIP file.
5. Extract the ZIP to get your `Exia Setup 0.1.0.exe` and `Exia-portable-0.1.0.exe`.

---

## 3. Local Build via Electron (On Your Computer)

If you want to run or package the desktop client locally:

### Step 1: Export the Web Bundle
From the repository root:
```bash
cd ui
pnpm web:build
```

### Step 2: Navigate to Desktop Shell & Install Dependencies
```bash
cd ../desktop
npm install
```

### Step 3: Run Desktop in Development
```bash
npm start
```
*Launches the native Electron desktop window loading the local bundle with live hardware media permissions.*

### Step 4: Package Windows Executables Locally
```bash
# Build both Installer and Portable EXE:
npm run build:exe

# Or build portable standalone only:
npm run build:portable

# Or build NSIS installer only:
npm run build:nsis
```
Output files are placed in:
`desktop/dist-electron/`
* `Exia Setup 0.1.0.exe`
* `Exia-portable-0.1.0.exe`

---

## 4. Connecting Desktop to Backend Gateway

When launching the desktop application:
* By default, it connects to the local FastAPI backend gateway at `http://127.0.0.1:12568/api`.
* Ensure your backend is running:
  ```bash
  cd backend
  uv run uvicorn main:app --reload --host 0.0.0.0 --port 12568
  ```
* For remote backends, update `EXPO_PUBLIC_API_URL` during the `web:build` step:
  ```bash
  EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api pnpm web:build
  ```
