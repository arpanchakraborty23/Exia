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

## Cross-Platform UI Pattern Alignment Contract

To maintain visual parity and behavioral consistency across Android, Web, and native Windows desktop, the Windows client follows the **EXACT SAME** UI architecture:

### 1. Design Tokens (`@exia/design-tokens`)
- **Theme**: Dark mode default (`#090909` canvas background, `#111111` card surface).
- **Brand Colors**:
  - Primary / Focus Ring: Electric Cyan (`#1fd5f9` in dark mode).
  - Live Status: Live Emerald (`#10b981` — strictly reserved for active/connected indicators).
- **Surface Ladder**: LiveKit surface elevation (`lkSurface1` `#111111` .. `lkSurface5` `#2e2e2e`).
- **Spacing Scale**: 4pt-based scale (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `xxl: 32`, `xxxl: 48`).
- **Radius Scale**: Multi-tiered curves (`sm: 6`, `base`/`md: 10`, `lg: 14`, `xl: 20`, `full: 9999`).
- **Typography Scale**: Clean sans scale (`xs: 12` .. `xxl: 32`), reserving tabular mono for data, latencies, and tokens.

### 2. Portable Primitives (`@exia/shared-ui`)
The Windows app imports identical primitives from `@exia/shared-ui`:
- **`ExiaScreen`**: Root window canvas container applying tokenized background and safe padding.
- **`ExiaCard`**: Elevated surface card with subtle border (`t.border`) and corner radius (`radius.lg`).
- **`ExiaText`**: Semantic typography component with `title`, `body`, `caption`, and `mono` variants.
- **`ExiaButton`**: Accessible interactive control supporting `primary`, `secondary`, and `destructive` variants, full hover (`onHoverIn`/`onHoverOut`) and keyboard focus (`onFocus`/`onBlur`) states, and 44pt touch/click hit targets.
- **`ExiaInput`**: Unified input field with tokenized colors (`t.input`, `t.border`), focus ring (`t.ring`), multiline support with top vertical alignment, and accessible labels.
- **`ExiaBadge`**: Semantic status indicator with `ok` (Live Emerald), `info` (Electric Cyan), `warn`, and `muted` tones.

### 3. Component & Screen Patterns
- **Headers**: Title with optional caption and back button (`ScreenHeader` pattern).
- **Form Fields**: Accessible labeled wrappers (`Field` pattern) combining `ExiaText` caption and `ExiaInput`.
- **States**: Every screen provides all four states — Loading (`Loading` indicator / `SkeletonCard`), Empty (`EmptyState` with call-to-action), Error (`ErrorState` with retry action), and Populated data.
- **Desktop Adaptation**: While preserving shared primitives and tokens, Windows leverages wide desktop real-estate via multi-column grids or side navigation rather than narrow mobile phone constraints.
