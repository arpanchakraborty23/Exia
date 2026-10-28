# Exia — Windows Client (Tauri 2)

Packages the shared web UI (`apps/web` static export) as a native Windows desktop application (WebView2, same runtime the old `Exia.exe` used).

## Prerequisites

- Node.js ≥ 20
- Rust toolchain (rustup, MSVC target) — `https://rustup.rs`
- WebView2 Runtime (preinstalled on Windows 10/11)

## Workflow

```bash
# Development (HMR): run the web dev server + Tauri window
cd ../web && npm run dev        # terminal 1 — http://localhost:3000
cd ../windows && npm run dev    # terminal 2 — tauri dev (uses devUrl)

# Production build
npm run build                   # builds apps/web (static export) + tauri build
# -> NSIS installer in src-tauri/target/release/bundle/nsis/
```

## Notes

- `frontendDist` points directly at `../../web/out` — no asset copying needed.
- `tauri dev` expects the web dev server on `localhost:3000` (`devUrl`).
- Mic/camera for voice sessions go through WebView2 permission prompts — verify on first run (see plan risk list).
- Icon: `src-tauri/icons/icon.ico` (copied from the legacy `backend/exia-icon.ico`).
