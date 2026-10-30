# Exia — Windows Client (React Native Windows — planned)

> **Status: NOT initialized yet.** This folder is a placeholder for the native
> React Native Windows app that replaces the retired Tauri 2 WebView shell
> (product-owner decision, see `../README.md` §2 "compatibility boundary").

## Why it is not scaffolded yet

1. **Version pairing must be verified first** (per `../README.md` §12):
   - Expo SDK 58 (the mobile app) uses **React Native 0.88**.
   - The current `react-native-windows` release is **0.85**, which pairs with
     **React Native 0.85** — a different RN minor than the Expo app.
   - Official pairing reference: https://microsoft.github.io/react-native-windows/docs/getting-started
2. **Duplicate React Native versions in one monorepo are unsupported** (Expo
   monorepo guide). This app therefore stays **outside** the pnpm workspace
   (`ui/pnpm-workspace.yaml` only globs `apps/mobile` and `packages/*`) and
   will get its own lockfile and install.
3. **Native toolchain is required to build/run** — scaffolding alone is
   possible, but per the plan we verify the pairing + prerequisites before
   running any init command.

## Prerequisites (before init)

- Visual Studio 2022 with the **C++ desktop development** workload
- A **Windows SDK** compatible with the chosen RNW release
- Node.js ≥ 20
- The matching `react-native` + `react-native-windows` version pair

## Planned init (verify against the versioned guide first)

```bash
# From ui/apps — template/pinning per the RNW versioned setup guide
npx react-native@<0.85.x> init ExiaWindows --template react-native-windows@<0.85.x>
```

Then: `npx react-native run-windows` (Debug), Release build via Visual Studio,
and the packaging/publishing workflow for the chosen distribution format
(MSIX/AppX or other).

## Verification checklist (from ui/README.md §9.3)

- [ ] Debug build launches on a real Windows machine
- [ ] Release build tested (not only the debugger build)
- [ ] Window resize behavior verified
- [ ] Mouse, keyboard, focus, and accessibility tested
- [ ] All native dependencies support the selected RNW version
- [ ] Packaging, signing, and clean-machine installation verified
