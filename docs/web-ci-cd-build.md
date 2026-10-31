# Exia Web — CI/CD Pipeline & Production Export Guide

This guide covers building and deploying the **Exia Universal Web Client** using **GitHub Actions cloud automation** or **local build commands**.

---

## 1. Web Architecture Overview

Exia's web client is the **same universal React Native application** (`ui/apps/mobile`), compiled for modern browsers via **React Native Web 0.21** and **Expo SDK 58**.

* **Zero Duplication**: Home, History, Analytics, Settings, dynamic theme palettes, and LiveKit WebRTC audio/video are shared across Mobile, Web, and Desktop.
* **Static Single Page Application (SPA)**: Generates a lightweight static distribution directory (`dist/`) that can be hosted on any static host or CDN.
* **Client-Side Routing**: Handled by Expo Router with `index.html` fallback.

---

## 2. CI/CD Architecture ([`.github/workflows/web-ci-cd.yml`](file:///E:/potfolio/Exia/.github/workflows/web-ci-cd.yml))

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Actions Cloud Pipeline                          │
│                                                                                 │
│  [ Git Push / PR / Manual Dispatch ]                                            │
│                 │                                                               │
│                 ▼                                                               │
│  ┌──────────────────────────────┐                                               │
│  │      Job 1: validate         │  pnpm 12.16.1 · Node.js 20                    │
│  │  • TypeScript Check (7 pkgs) │  tsc --noEmit across workspace                │
│  │  • Vitest Unit Tests         │  27/27 test suites                            │
│  └──────────────┬───────────────┘                                               │
│                 │                                                               │
│                 ▼                                                               │
│  ┌──────────────────────────────┐                                               │
│  │   Job 2: build-universal-web │  Compiles universal web bundle (pnpm web:build│
│  │  • Exports to `dist/`        │  Generates index.html, chunks, fonts, icons   │
│  │  • Uploads Artifact          │  Artifact: `exia-web-production` (ZIP)        │
│  └──────────────┬───────────────┘                                               │
│                 │                                                               │
│                 ▼ (Optional / Manual Trigger)                                   │
│  ┌──────────────────────────────┐                                               │
│  │   Job 3: deploy-pages        │  Deploys directly to GitHub Pages             │
│  │  • Live Web URL              │  https://<owner>.github.io/<repo>/            │
│  └──────────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. How to Build & Download the Web Bundle via GitHub Actions

### Step 1: Open GitHub Actions
1. Open your repository on GitHub.
2. Click the **Actions** tab at the top.

### Step 2: Select the Web Workflow
1. Select **"Exia Web — CI/CD & Production Build"** from the left sidebar.
2. Click the **Run workflow** dropdown on the right:
   * **Use workflow from**: `main`
   * **Deployment / Output Target**:
     * `artifact-only` *(Default)*: Compiles the bundle and creates a downloadable ZIP.
     * `github-pages`: Compiles and automatically deploys to live GitHub Pages.
     * `both`: Generates the downloadable ZIP and deploys to GitHub Pages.
   * **Also compile legacy Next.js client**: Set to `true` if you wish to build the legacy `ui/apps/web` client.
   * **Run Typecheck and Tests before building**: Kept checked (`true`).
3. Click **Run workflow**.

### Step 3: Download Your Web Bundle
1. The build completes in **1 to 2 minutes**.
2. Click on the completed workflow run.
3. Scroll down to **Artifacts** and download **`exia-web-production`** (ZIP).

---

## 4. Local Build Commands

To build and test the web client locally:

```bash
# 1. Export production web bundle from ui/
cd ui
pnpm web:build
# Output: ui/apps/mobile/dist/

# 2. Test locally with SPA fallback server:
npx serve -s apps/mobile/dist -p 3000

# 3. Or run live dev server with hot reload:
pnpm web:start
```

---

## 5. Deployment Options for the Web Export

The unzipped contents of `exia-web-production` can be deployed to:
1. **GitHub Pages**: Automated via the workflow's `github-pages` option.
2. **Cloudflare Pages / Vercel / Netlify**: Connect to your repo or drag-and-drop the `dist` folder.
3. **Exia FastAPI Gateway**: Copy `ui/apps/mobile/dist` into `backend/dist` to let the backend serve both the REST API and the web frontend on port `12568`.
4. **Nginx / Docker**: Place `dist` in `/usr/share/nginx/html` with `try_files $uri $uri/ /index.html;`.
