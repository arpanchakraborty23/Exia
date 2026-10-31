# Exia — Windows Desktop Client (Electron)

Desktop client for **Exia**, wrapping the universal Expo web bundle into a standalone native Windows desktop application with full hardware WebRTC (microphone, camera, display-capture) permissions.

---

## 1. Quick Start (Development)

### Prerequisites
* Node.js ≥ 20
* The universal web bundle must be built first:
  ```bash
  cd ../ui
  pnpm web:build
  ```

### Run Locally
```bash
cd ../desktop
npm install
node scripts/sync-dist.js
npm start
```

---

## 2. Packaging Standalone Windows .EXE

To generate production Windows binaries locally:

```bash
# Package both NSIS Installer and Portable Executable:
npm run build:exe

# Package Portable Standalone only (single .exe file):
npm run build:portable

# Package NSIS Installer only:
npm run build:nsis
```

Outputs are placed in:
`desktop/dist-electron/`
* `Exia Setup 0.1.0.exe` (Standard Windows installer)
* `Exia-portable-0.1.0.exe` (Single-file portable executable)

---

## 3. Automated Cloud Builds (GitHub Actions)

If you do not want to install Electron dependencies or build locally, use the GitHub Actions cloud workflow:
* Workflow file: [`.github/workflows/desktop-ci-cd.yml`](../.github/workflows/desktop-ci-cd.yml)
* Guide: [`docs/desktop-ci-cd-exe-build.md`](../docs/desktop-ci-cd-exe-build.md)
