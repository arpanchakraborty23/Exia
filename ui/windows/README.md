# Exia — Windows Client (Tauri 2)

Packages the shared web UI ([`ui/web`](file:///e:/potfolio/Exia/ui/web) Next.js static export) as a native Windows desktop application using **Tauri 2**, **Rust**, and the native **Microsoft Edge WebView2** runtime.

---

## 1. Prerequisites

- **Node.js** ≥ 20
- **Rust Toolchain** (`cargo`, `rustc` with `x86_64-pc-windows-msvc` target) — install from [https://rustup.rs](https://rustup.rs)
- **WebView2 Runtime** (preinstalled on modern Windows 10 & 11)

---

## 2. Fast Build via Script

The recommended way to compile the Windows Desktop application is using the root script:

```bash
# Production release build (NSIS installer & binary mirrored to release/)
./scripts/desktop.sh

# Fast debug build
./scripts/desktop.sh --debug

# Compile Tauri shell reusing existing web export without rebuilding Next.js
./scripts/desktop.sh --skip-web
```

---

## 3. Manual Workflow

```bash
# Development (with Hot Module Replacement):
cd ../web && npm run dev        # Terminal 1 — Next.js dev server on http://localhost:3000
cd ../windows && npm run dev    # Terminal 2 — Tauri window pointing to devUrl

# Production build:
cd ../windows
npm run build                   # Builds ui/web/out, then runs tauri build
# Artifacts generated in: src-tauri/target/release/bundle/nsis/
```

---

## 4. Key Configuration Notes

- **Zero Asset Duplication**: `frontendDist` in `src-tauri/tauri.conf.json` points directly to `../../web/out`.
- **CORS Allowlist**: The FastAPI backend (`backend/main.py`) explicitly permits requests originating from `tauri://localhost` and `http://tauri.localhost`.
- **Media Hardware Permissions**: Voice streaming and webcam inspection run directly through native WebView2 hardware permission grants.
- **Application Icon**: Configured in `src-tauri/icons/icon.ico`.
